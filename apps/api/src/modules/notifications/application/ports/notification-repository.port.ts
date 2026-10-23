import type { NotificationEntity } from '../../domain/notification.entity';

export const NOTIFICATION_REPOSITORY = Symbol('NOTIFICATION_REPOSITORY');

export interface CreateNotificationData {
  userId: string;
  type: NotificationEntity['type'];
  title: string;
  body: string;
  relatedConversationId?: string | null;
}

export interface NotificationRepositoryPort {
  create(data: CreateNotificationData): Promise<NotificationEntity>;
  listForUser(userId: string, limit?: number): Promise<NotificationEntity[]>;
  markRead(id: string, userId: string): Promise<void>;
  markAllRead(userId: string): Promise<void>;
}
