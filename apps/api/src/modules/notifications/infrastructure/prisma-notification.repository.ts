import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';
import type { NotificationEntity } from '../domain/notification.entity';
import type {
  CreateNotificationData,
  NotificationRepositoryPort,
} from '../application/ports/notification-repository.port';

@Injectable()
export class PrismaNotificationRepository implements NotificationRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateNotificationData): Promise<NotificationEntity> {
    return await this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        relatedConversationId: data.relatedConversationId ?? null,
      },
    });
  }

  async listForUser(userId: string, limit = 50): Promise<NotificationEntity[]> {
    return await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async markRead(id: string, userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }
}
