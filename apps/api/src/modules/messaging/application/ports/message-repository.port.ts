import type { MessageEntity } from '../../domain/message.entity';

export const MESSAGE_REPOSITORY = Symbol('MESSAGE_REPOSITORY');

/** Attachment fields copied when forwarding (a new row per message, same file). */
export interface CloneAttachmentData {
  type: 'image' | 'file';
  url: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
}

export interface CreateMessageData {
  conversationId: string;
  senderId: string;
  content: string;
  attachmentIds?: string[];
  /** Quoted message this one replies to. */
  replyToId?: string | null;
  /** Marks a copy created by forwarding rather than composed in this thread. */
  forwarded?: boolean;
  /** Attachments re-created for a forwarded message. */
  cloneAttachments?: CloneAttachmentData[];
}

export interface MessagePage {
  messages: MessageEntity[];
  nextCursor: string | null;
}

export interface MessageRepositoryPort {
  create(data: CreateMessageData): Promise<MessageEntity>;
  findById(messageId: string): Promise<MessageEntity | null>;
  listByConversation(
    conversationId: string,
    cursor?: string,
    limit?: number,
  ): Promise<MessagePage>;
  /** Clears content/attachments and stamps deletedAt; returns the tombstone. */
  softDelete(messageId: string): Promise<MessageEntity>;
  touchConversation(conversationId: string): Promise<void>;
}
