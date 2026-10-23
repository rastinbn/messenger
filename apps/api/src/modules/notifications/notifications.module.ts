import { Module } from '@nestjs/common';

import { NotificationsService } from './application/notifications.service';
import { NOTIFICATION_REPOSITORY } from './application/ports/notification-repository.port';
import { PrismaNotificationRepository } from './infrastructure/prisma-notification.repository';
import { NotificationsController } from './interface/notifications.controller';

@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: PrismaNotificationRepository,
    },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
