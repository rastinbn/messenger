import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";

import { ConversationsService } from "../../../conversations/application/conversations.service";
import { extractHandshakeToken, verifyAccessToken } from "../../../messaging/interface/ws/ws-jwt.util";

interface AuthenticatedSocket extends Socket {
  data: { userId: string; username: string; displayName: string };
}

interface SignalPayload {
  conversationId: string;
  toUserId: string;
  data: unknown; // RTCSessionDescriptionInit | RTCIceCandidateInit — opaque to the server, just relayed
}

function callRoom(conversationId: string): string {
  return `call:${conversationId}`;
}

function userRoom(userId: string): string {
  return `user:${userId}`;
}

/**
 * WebRTC signaling relay for group calls (mesh topology — every participant
 * connects directly to every other participant; the server never touches
 * media, only exchanges offers/answers/ICE candidates). See
 * docs/video-calls.md for the full protocol and the mesh-topology tradeoff
 * (scales to a handful of participants, not dozens).
 *
 * Runs as its own gateway (separate from MessagingGateway) attached to the
 * same default Socket.IO namespace — deliberately decoupled so call
 * signaling logic doesn't need to be threaded through the messaging
 * module. Each gateway authenticates the connection independently.
 */
@WebSocketGateway({ cors: true })
export class CallsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(CallsGateway.name);

  /** conversationId -> set of userIds currently in that call. In-memory only — see docs/video-calls.md for the multi-instance caveat (same one as PresenceService pre-Redis). */
  private readonly activeCallParticipants = new Map<string, Set<string>>();
  /** socket.id -> conversationId, so we know which call to clean up on disconnect. */
  private readonly socketCallMembership = new Map<string, string>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly conversationsService: ConversationsService
  ) {}

  async handleConnection(socket: Socket): Promise<void> {
    const token = extractHandshakeToken(socket);
    if (!token) return this.reject(socket, "Missing authentication token.");

    const payload = verifyAccessToken(
      this.jwtService,
      token,
      this.config.getOrThrow<string>("JWT_ACCESS_SECRET")
    );
    if (!payload) return this.reject(socket, "Invalid or expired token.");

    const authed = socket as AuthenticatedSocket;
    authed.data = { userId: payload.sub, username: payload.username, displayName: payload.username };
    await socket.join(userRoom(payload.sub));
  }

  handleDisconnect(socket: Socket): void {
    const conversationId = this.socketCallMembership.get(socket.id);
    if (!conversationId) return;
    const authed = socket as AuthenticatedSocket;
    this.leaveCall(authed, conversationId);
  }

  private reject(socket: Socket, reason: string): void {
    socket.emit("error", { message: reason });
    socket.disconnect(true);
  }

  // --- Joining / leaving -----------------------------------------------------

  @SubscribeMessage("call:invite")
  async handleInvite(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() body: { conversationId: string }
  ): Promise<void> {
    await this.conversationsService.assertParticipant(body.conversationId, socket.data.userId);

    // Notify every *other* participant of the conversation that a call is
    // starting — they may not have the conversation's call room joined yet,
    // so this goes to their personal room, not the call room.
    const conversation = await this.conversationsService.getForUser(
      body.conversationId,
      socket.data.userId
    );
    for (const participant of conversation.participants) {
      if (participant.userId === socket.data.userId) continue;
      this.server.to(userRoom(participant.userId)).emit("call:incoming", {
        conversationId: body.conversationId,
        fromUserId: socket.data.userId
      });
    }
  }

  @SubscribeMessage("call:join")
  async handleJoin(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() body: { conversationId: string }
  ): Promise<void> {
    await this.conversationsService.assertParticipant(body.conversationId, socket.data.userId);

    const room = callRoom(body.conversationId);
    const existingParticipants = Array.from(
      this.activeCallParticipants.get(body.conversationId) ?? []
    );

    await socket.join(room);
    this.socketCallMembership.set(socket.id, body.conversationId);

    if (!this.activeCallParticipants.has(body.conversationId)) {
      this.activeCallParticipants.set(body.conversationId, new Set());
    }
    this.activeCallParticipants.get(body.conversationId)!.add(socket.data.userId);

    // Tell the joining client who's already there, so it knows which peer
    // connections to initiate (mesh: new joiner connects to everyone already present).
    socket.emit("call:participants", {
      conversationId: body.conversationId,
      participantIds: existingParticipants
    });

    // Tell everyone already in the call room that a new peer joined, so
    // *they* also initiate a connection toward the new joiner.
    socket.to(room).emit("call:peer-joined", {
      conversationId: body.conversationId,
      userId: socket.data.userId
    });

    this.logger.log(`User ${socket.data.userId} joined call ${body.conversationId}`);
  }

  @SubscribeMessage("call:leave")
  handleLeave(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() body: { conversationId: string }
  ): void {
    this.leaveCall(socket, body.conversationId);
  }

  private leaveCall(socket: AuthenticatedSocket, conversationId: string): void {
    const room = callRoom(conversationId);
    socket.leave(room);
    this.socketCallMembership.delete(socket.id);

    const participants = this.activeCallParticipants.get(conversationId);
    participants?.delete(socket.data.userId);
    if (participants && participants.size === 0) {
      this.activeCallParticipants.delete(conversationId);
    }

    this.server.to(room).emit("call:peer-left", { conversationId, userId: socket.data.userId });
    this.logger.log(`User ${socket.data.userId} left call ${conversationId}`);
  }

  // --- WebRTC signaling relay -----------------------------------------------

  @SubscribeMessage("call:signal")
  handleSignal(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() body: SignalPayload
  ): void {
    // The server never inspects `data` — it's an opaque SDP offer/answer or
    // ICE candidate, meaningful only to the two browsers involved.
    this.server.to(userRoom(body.toUserId)).emit("call:signal", {
      conversationId: body.conversationId,
      fromUserId: socket.data.userId,
      data: body.data
    });
  }

  @SubscribeMessage("call:media-state")
  handleMediaState(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() body: { conversationId: string; audioEnabled: boolean; videoEnabled: boolean }
  ): void {
    socket.to(callRoom(body.conversationId)).emit("call:media-state", {
      conversationId: body.conversationId,
      userId: socket.data.userId,
      audioEnabled: body.audioEnabled,
      videoEnabled: body.videoEnabled
    });
  }
}
