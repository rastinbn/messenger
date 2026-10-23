import type { AttachmentType, MessageStatus } from '@messenger/shared-types';

export interface AttachmentEntity {
  id: string;
  type: AttachmentType;
  url: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
}

/** The compact quote shown above a reply — not a full MessageEntity. */
export interface MessageReplyPreviewEntity {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  deletedAt: Date | null;
}

export interface MessageEntity {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  status: MessageStatus;
  editedAt: Date | null;
  createdAt: Date;
  /** Soft-delete marker; content and attachments are cleared when this is set. */
  deletedAt: Date | null;
  forwarded: boolean;
  replyTo: MessageReplyPreviewEntity | null;
  attachments: AttachmentEntity[];
}
