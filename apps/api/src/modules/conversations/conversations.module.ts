import { Module } from '@nestjs/common';

import { ConversationsService } from './application/conversations.service';
import { CONVERSATION_REPOSITORY } from './application/ports/conversation-repository.port';
import { PrismaConversationRepository } from './infrastructure/prisma-conversation.repository';
import { ConversationsController } from './interface/conversations.controller';

@Module({
  controllers: [ConversationsController],
  providers: [
    ConversationsService,
    {
      provide: CONVERSATION_REPOSITORY,
      useClass: PrismaConversationRepository,
    },
  ],
  exports: [ConversationsService],
})
export class ConversationsModule {}
