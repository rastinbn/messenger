import type { ConversationEntity } from '../../domain/conversation.entity';

export const CONVERSATION_REPOSITORY = Symbol('CONVERSATION_REPOSITORY');

export interface ConversationRepositoryPort {
  listForUser(userId: string): Promise<ConversationEntity[]>;
  findById(id: string, forUserId: string): Promise<ConversationEntity | null>;
  isParticipant(conversationId: string, userId: string): Promise<boolean>;
  create(params: {
    type: 'direct' | 'group';
    name: string | null;
    participantIds: string[];
    creatorId: string;
  }): Promise<ConversationEntity>;
  findDirectConversationBetween(
    userAId: string,
    userBId: string,
  ): Promise<ConversationEntity | null>;
  markRead(conversationId: string, userId: string): Promise<void>;
}
