import { Inject, Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";

import { ConversationsService } from "../../conversations/application/conversations.service";
import { NotificationsService } from "../../notifications/application/notifications.service";
import { EmptyMessageError, MessageNotFoundError, MessageNotOwnedError } from "../domain/errors";
import type { MessageEntity } from "../domain/message.entity";

import {
  MESSAGE_REPOSITORY,
  type MessagePage,
  type MessageRepositoryPort
} from "./ports/message-repository.port";

export const MESSAGE_CREATED_EVENT = "message.created";
export const MESSAGE_DELETED_EVENT = "message.deleted";

export interface MessageCreatedEvent {
  message: MessageEntity;
}

export interface MessageDeletedEvent {
  message: MessageEntity;
}

@Injectable()
export class MessagingService {
  constructor(
    @Inject(MESSAGE_REPOSITORY) private readonly messages: MessageRepositoryPort,
    private readonly conversationsService: ConversationsService,
    private readonly notificationsService: NotificationsService,
    private readonly events: EventEmitter2
  ) {}

  async listMessages(conversationId: string, userId: string, cursor?: string): Promise<MessagePage> {
    await this.conversationsService.assertParticipant(conversationId, userId);
    return this.messages.listByConversation(conversationId, cursor);
  }

  async sendMessage(params: {
    conversationId: string;
    senderId: string;
    content: string;
    attachmentIds?: string[];
    replyToId?: string;
  }): Promise<MessageEntity> {
    const hasContent = params.content.trim().length > 0;
    const hasAttachments = !!params.attachmentIds?.length;
    if (!hasContent && !hasAttachments) throw new EmptyMessageError();

    await this.conversationsService.assertParticipant(params.conversationId, params.senderId);

    if (params.replyToId) {
      const quoted = await this.messages.findById(params.replyToId);
      // A reply may only quote a live message from the same thread.
      if (!quoted || quoted.conversationId !== params.conversationId) {
        throw new MessageNotFoundError();
      }
    }

    const message = await this.messages.create({
      conversationId: params.conversationId,
      senderId: params.senderId,
      content: params.content,
      attachmentIds: params.attachmentIds,
      replyToId: params.replyToId
    });
    await this.messages.touchConversation(params.conversationId);

    this.events.emit(MESSAGE_CREATED_EVENT, { message } satisfies MessageCreatedEvent);

    await this.notifyOtherParticipants(params.conversationId, params.senderId, message);

    return message;
  }

  /**
   * Soft-deletes a message. Only the author may do it; everyone in the room gets
   * the tombstone over `message:deleted` so open clients don't need to refetch.
   */
  async deleteMessage(params: { messageId: string; userId: string }): Promise<MessageEntity> {
    const message = await this.messages.findById(params.messageId);
    if (!message) throw new MessageNotFoundError();

    await this.conversationsService.assertParticipant(message.conversationId, params.userId);
    if (message.senderId !== params.userId) throw new MessageNotOwnedError();

    // Deleting twice is a no-op rather than an error — the client may retry.
    if (message.deletedAt) return message;

    const deleted = await this.messages.softDelete(message.id);
    this.events.emit(MESSAGE_DELETED_EVENT, { message: deleted } satisfies MessageDeletedEvent);
    return deleted;
  }

  /**
   * Copies a message into another conversation the user belongs to. The copy is
   * a normal new message (so notifications/realtime/pagination all work) that is
   * flagged as forwarded and carries cloned attachments.
   */
  async forwardMessage(params: {
    messageId: string;
    userId: string;
    targetConversationId: string;
  }): Promise<MessageEntity> {
    const original = await this.messages.findById(params.messageId);
    if (!original || original.deletedAt) throw new MessageNotFoundError();

    await this.conversationsService.assertParticipant(original.conversationId, params.userId);
    await this.conversationsService.assertParticipant(params.targetConversationId, params.userId);

    const forwarded = await this.messages.create({
      conversationId: params.targetConversationId,
      senderId: params.userId,
      content: original.content,
      forwarded: true,
      cloneAttachments: original.attachments.map((attachment) => ({
        type: attachment.type,
        url: attachment.url,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        sizeBytes: attachment.sizeBytes,
        width: attachment.width,
        height: attachment.height
      }))
    });
    await this.messages.touchConversation(params.targetConversationId);

    this.events.emit(MESSAGE_CREATED_EVENT, { message: forwarded } satisfies MessageCreatedEvent);

    await this.notifyOtherParticipants(params.targetConversationId, params.userId, forwarded);

    return forwarded;
  }

  private async notifyOtherParticipants(
    conversationId: string,
    senderId: string,
    message: MessageEntity
  ): Promise<void> {
    const conversation = await this.conversationsService.getForUser(conversationId, senderId);
    const sender = conversation.participants.find((p) => p.userId === senderId)?.user;
    const others = conversation.participants.filter((p) => p.userId !== senderId);

    const preview = message.content || (message.attachments[0]?.type === "image" ? "📷 Photo" : "📎 File");

    await Promise.all(
      others.map((participant) =>
        this.notificationsService.create({
          userId: participant.userId,
          type: "message",
          title: sender?.displayName ?? "New message",
          body: preview.slice(0, 200),
          relatedConversationId: conversationId
        })
      )
    );
  }
}
