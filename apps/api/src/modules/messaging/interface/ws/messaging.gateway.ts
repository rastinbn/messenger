import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

import { ConversationsService } from '../../../conversations/application/conversations.service';
import { PresenceService } from '../../../presence/application/presence.service';
import { MessagingService } from '../../application/messaging.service';
import {
  MESSAGE_CREATED_EVENT,
  MESSAGE_DELETED_EVENT,
  type MessageCreatedEvent,
  type MessageDeletedEvent,
} from '../../application/messaging.service';
import { toMessageDto } from '../messages.mapper';

import { extractHandshakeToken, verifyAccessToken } from './ws-jwt.util';

interface AuthenticatedSocket extends Socket {
  data: { userId: string; username: string };
}

const HEARTBEAT_INTERVAL_MS = 25_000;

function conversationRoom(conversationId: string): string {
  return `conversation:${conversationId}`;
}

/**
 * Single gateway handling presence, typing, message delivery, and read
 * receipts. Namespace: `/` (default). Full event contract documented in
 * docs/socket-protocol.md — keep that file in sync with this one.
 */
@WebSocketGateway({ cors: true })
export class MessagingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(MessagingGateway.name);
  private readonly heartbeatTimers = new Map<
    string,
    ReturnType<typeof setInterval>
  >();

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly conversationsService: ConversationsService,
    private readonly presenceService: PresenceService,
    private readonly messagingService: MessagingService,
  ) {}

  // --- Connection lifecycle -------------------------------------------------

  async handleConnection(socket: Socket): Promise<void> {
    const token = extractHandshakeToken(socket);
    if (!token)
      return this.rejectConnection(socket, 'Missing authentication token.');

    const payload = verifyAccessToken(
      this.jwtService,
      token,
      this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    );
    if (!payload)
      return this.rejectConnection(socket, 'Invalid or expired token.');

    const authed = socket as AuthenticatedSocket;
    authed.data = { userId: payload.sub, username: payload.username };

    // Join a personal room (for notification-style pushes) and every
    // conversation room the user currently participates in.
    await socket.join(`user:${payload.sub}`);
    const conversations = await this.conversationsService.listForUser(
      payload.sub,
    );
    for (const conversation of conversations) {
      await socket.join(conversationRoom(conversation.id));
    }

    await this.presenceService.connect(payload.sub);
    this.broadcastPresence(payload.sub, true);

    const timer = setInterval(() => {
      this.presenceService
        .heartbeat(payload.sub)
        .catch((err: Error) => this.logger.warn(err.message));
    }, HEARTBEAT_INTERVAL_MS);
    this.heartbeatTimers.set(socket.id, timer);

    this.logger.log(
      `Socket connected: user=${payload.sub} socket=${socket.id}`,
    );
  }

  async handleDisconnect(socket: Socket): Promise<void> {
    const authed = socket as AuthenticatedSocket;
    const timer = this.heartbeatTimers.get(socket.id);
    if (timer) {
      clearInterval(timer);
      this.heartbeatTimers.delete(socket.id);
    }

    if (!authed.data?.userId) return;

    // Only mark fully offline if this was the user's last connected socket
    // (they may have multiple tabs/devices open).
    const remainingSockets = await this.server
      .in(`user:${authed.data.userId}`)
      .fetchSockets();
    const stillConnected = remainingSockets.some((s) => s.id !== socket.id);
    if (!stillConnected) {
      await this.presenceService.disconnect(authed.data.userId);
      this.broadcastPresence(authed.data.userId, false);
    }

    this.logger.log(
      `Socket disconnected: user=${authed.data.userId} socket=${socket.id}`,
    );
  }

  private rejectConnection(socket: Socket, reason: string): void {
    socket.emit('error', { message: reason });
    socket.disconnect(true);
  }

  private broadcastPresence(userId: string, online: boolean): void {
    this.server.emit('presence:update', { userId, online });
  }

  // --- Client -> server events -----------------------------------------------

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() body: { conversationId: string },
  ): void {
    socket.to(conversationRoom(body.conversationId)).emit('typing:update', {
      conversationId: body.conversationId,
      userId: socket.data.userId,
      isTyping: true,
    });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() body: { conversationId: string },
  ): void {
    socket.to(conversationRoom(body.conversationId)).emit('typing:update', {
      conversationId: body.conversationId,
      userId: socket.data.userId,
      isTyping: false,
    });
  }

  @SubscribeMessage('message:send')
  async handleMessageSend(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody()
    body: {
      conversationId: string;
      content: string;
      attachmentIds?: string[];
      replyToId?: string;
    },
  ): Promise<void> {
    // Delegates to the same application service the REST controller uses —
    // MessagingService emits MESSAGE_CREATED_EVENT, which this gateway's
    // @OnEvent handler below broadcasts to the room. This socket does not
    // broadcast directly, so REST-originated sends are delivered identically.
    await this.messagingService.sendMessage({
      conversationId: body.conversationId,
      senderId: socket.data.userId,
      content: body.content,
      attachmentIds: body.attachmentIds,
      replyToId: body.replyToId,
    });
  }

  @SubscribeMessage('message:read')
  async handleMessageRead(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() body: { conversationId: string },
  ): Promise<void> {
    await this.conversationsService.markRead(
      body.conversationId,
      socket.data.userId,
    );
    socket.to(conversationRoom(body.conversationId)).emit('message:read', {
      conversationId: body.conversationId,
      userId: socket.data.userId,
      readAt: new Date().toISOString(),
    });
  }

  @SubscribeMessage('heartbeat')
  async handleHeartbeat(
    @ConnectedSocket() socket: AuthenticatedSocket,
  ): Promise<void> {
    await this.presenceService.heartbeat(socket.data.userId);
  }

  // --- Server -> clients (event bus, not tied to any single socket call) -----

  @OnEvent(MESSAGE_CREATED_EVENT)
  handleMessageCreated({ message }: MessageCreatedEvent): void {
    this.server
      .to(conversationRoom(message.conversationId))
      .emit('message:new', toMessageDto(message));
  }

  @OnEvent(MESSAGE_DELETED_EVENT)
  handleMessageDeleted({ message }: MessageDeletedEvent): void {
    // The tombstone (empty content, deletedAt set) goes to everyone in the room,
    // including its author's other tabs — no refetch needed.
    this.server
      .to(conversationRoom(message.conversationId))
      .emit('message:deleted', toMessageDto(message));
  }
}
