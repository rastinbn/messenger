import { z } from "zod";

export const MessageStatusSchema = z.enum(["sending", "sent", "delivered", "read", "failed"]);
export type MessageStatus = z.infer<typeof MessageStatusSchema>;

export const AttachmentTypeSchema = z.enum(["image", "file"]);
export type AttachmentType = z.infer<typeof AttachmentTypeSchema>;

export const AttachmentSchema = z.object({
  id: z.string().uuid(),
  type: AttachmentTypeSchema,
  url: z.string().url(),
  fileName: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int().positive(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional()
});
export type Attachment = z.infer<typeof AttachmentSchema>;

export const MessageReplyPreviewSchema = z.object({
  id: z.string().uuid(),
  senderId: z.string().uuid(),
  senderName: z.string(),
  content: z.string().max(4000),
  deletedAt: z.string().datetime().nullable()
});
export type MessageReplyPreview = z.infer<typeof MessageReplyPreviewSchema>;

/**
 * One emoji and everyone who reacted with it. The API groups reactions this way
 * because the UI only ever needs counts plus "did I react?", and it keeps the
 * payload the same for every viewer (each client decides `mine` locally).
 */
export const MessageReactionSchema = z.object({
  emoji: z.string().min(1).max(16),
  userIds: z.array(z.string().uuid())
});
export type MessageReaction = z.infer<typeof MessageReactionSchema>;

export const MessageSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  senderId: z.string().uuid(),
  content: z.string().max(4000),
  attachments: z.array(AttachmentSchema),
  status: MessageStatusSchema,
  editedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  /** Quoted message this one replies to, if any. */
  replyTo: MessageReplyPreviewSchema.nullable().default(null),
  /** True when the message was forwarded rather than composed here. */
  forwarded: z.boolean().default(false),
  /** Set for soft-deleted messages; content/attachments are cleared for everyone. */
  deletedAt: z.string().datetime().nullable().default(null),
  /** Grouped emoji reactions; one reaction per user per message. */
  reactions: z.array(MessageReactionSchema).default([])
});
export type Message = z.infer<typeof MessageSchema>;

export const SendMessageInputSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1).max(4000),
  attachmentIds: z.array(z.string().uuid()).optional(),
  replyToId: z.string().uuid().optional()
});
export type SendMessageInput = z.infer<typeof SendMessageInputSchema>;

export const ForwardMessageInputSchema = z.object({
  messageId: z.string().uuid(),
  conversationId: z.string().uuid()
});
export type ForwardMessageInput = z.infer<typeof ForwardMessageInputSchema>;
