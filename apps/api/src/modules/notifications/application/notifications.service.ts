import { Inject, Injectable } from '@nestjs/common';

import type { NotificationEntity } from '../domain/notification.entity';

import {
  NOTIFICATION_REPOSITORY,
  type CreateNotificationData,
  type NotificationRepositoryPort,
} from './ports/notification-repository.port';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notifications: NotificationRepositoryPort,
  ) {}

  async listForUser(userId: string): Promise<NotificationEntity[]> {
    return this.notifications.listForUser(userId, 50);
  }

  async create(data: CreateNotificationData): Promise<NotificationEntity> {
    return this.notifications.create(data);
  }

  async markRead(id: string, userId: string): Promise<void> {
    await this.notifications.markRead(id, userId);
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notifications.markAllRead(userId);
  }
}
