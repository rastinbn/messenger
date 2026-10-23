import { z } from "zod";

import { PublicUserSchema } from "./user";

export const ConversationTypeSchema = z.enum(["direct", "group"]);
export type ConversationType = z.infer<typeof ConversationTypeSchema>;

export const ConversationSchema = z.object({
  id: z.string().uuid(),
  type: ConversationTypeSchema,
  name: z.string().max(100).nullable(), // null for direct conversations
  avatarUrl: z.string().url().nullable(),
  participants: z.array(PublicUserSchema),
  lastMessagePreview: z.string().max(200).nullable(),
  lastMessageAt: z.string().datetime().nullable(),
  unreadCount: z.number().int().min(0),
  createdAt: z.string().datetime()
});
export type Conversation = z.infer<typeof ConversationSchema>;
