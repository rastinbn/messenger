import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { ConversationsModule } from '../conversations/conversations.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PresenceModule } from '../presence/presence.module';

import { MessagingService } from './application/messaging.service';
import { MESSAGE_REPOSITORY } from './application/ports/message-repository.port';
import { PrismaMessageRepository } from './infrastructure/prisma-message.repository';
import { MessageActionsController } from './interface/message-actions.controller';
import { MessagesController } from './interface/messages.controller';
import { MessagingGateway } from './interface/ws/messaging.gateway';

@Module({
  imports: [
    ConversationsModule,
    NotificationsModule,
    PresenceModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      }),
    }),
  ],
  controllers: [MessagesController, MessageActionsController],
  providers: [
    MessagingService,
    MessagingGateway,
    { provide: MESSAGE_REPOSITORY, useClass: PrismaMessageRepository },
  ],
  exports: [MessagingService],
})
export class MessagingModule {}
