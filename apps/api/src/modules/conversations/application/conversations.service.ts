import { Inject, Injectable } from '@nestjs/common';

import type { ConversationEntity } from '../domain/conversation.entity';
import {
  ConversationNotFoundError,
  NotAConversationParticipantError,
} from '../domain/errors';

import {
  CONVERSATION_REPOSITORY,
  type ConversationRepositoryPort,
} from './ports/conversation-repository.port';

@Injectable()
export class ConversationsService {
  constructor(
    @Inject(CONVERSATION_REPOSITORY)
    private readonly conversations: ConversationRepositoryPort,
  ) {}

  async listForUser(userId: string): Promise<ConversationEntity[]> {
    return this.conversations.listForUser(userId);
  }

  async getForUser(
    conversationId: string,
    userId: string,
  ): Promise<ConversationEntity> {
    const conversation = await this.conversations.findById(
      conversationId,
      userId,
    );
    if (!conversation) throw new ConversationNotFoundError(conversationId);
    return conversation;
  }

  /** Throws if the user isn't a participant — call before any message read/write. */
  async assertParticipant(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    const isParticipant = await this.conversations.isParticipant(
      conversationId,
      userId,
    );
    if (!isParticipant) throw new NotAConversationParticipantError();
  }

  async create(
    creatorId: string,
    participantIds: string[],
    name?: string,
  ): Promise<ConversationEntity> {
    const allParticipantIds = Array.from(
      new Set([creatorId, ...participantIds]),
    );
    const isGroup = allParticipantIds.length > 2 || !!name;

    // For 1:1 DMs, reuse an existing conversation instead of creating duplicates.
    if (!isGroup && allParticipantIds.length === 2) {
      const [a, b] = allParticipantIds as [string, string];
      const existing = await this.conversations.findDirectConversationBetween(
        a,
        b,
      );
      if (existing) return existing;
    }

    return this.conversations.create({
      type: isGroup ? 'group' : 'direct',
      name: isGroup ? (name ?? null) : null,
      participantIds: allParticipantIds,
      creatorId,
    });
  }

  async markRead(conversationId: string, userId: string): Promise<void> {
    await this.assertParticipant(conversationId, userId);
    await this.conversations.markRead(conversationId, userId);
  }
}
