import type { NotificationType } from '@messenger/shared-types';

export interface NotificationEntity {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  relatedConversationId: string | null;
  createdAt: Date;
}
