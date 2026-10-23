import { z } from "zod";

export const NotificationTypeSchema = z.enum([
  "message",
  "mention",
  "friend_request",
  "system"
]);
export type NotificationType = z.infer<typeof NotificationTypeSchema>;

export const NotificationSchema = z.object({
  id: z.string().uuid(),
  type: NotificationTypeSchema,
  title: z.string(),
  body: z.string(),
  read: z.boolean(),
  relatedConversationId: z.string().uuid().nullable(),
  createdAt: z.string().datetime()
});
export type Notification = z.infer<typeof NotificationSchema>;
