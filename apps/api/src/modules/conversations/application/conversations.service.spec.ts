import { Test } from '@nestjs/testing';

import type { ConversationEntity } from '../domain/conversation.entity';
import { NotAConversationParticipantError } from '../domain/errors';

import { ConversationsService } from './conversations.service';
import {
  CONVERSATION_REPOSITORY,
  type ConversationRepositoryPort,
} from './ports/conversation-repository.port';

function makeConversation(
  overrides: Partial<ConversationEntity> = {},
): ConversationEntity {
  return {
    id: 'conv-1',
    type: 'direct',
    name: null,
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    participants: [],
    lastMessagePreview: null,
    lastMessageAt: null,
    unreadCount: 0,
    ...overrides,
  };
}

class FakeConversationRepository implements ConversationRepositoryPort {
  conversations: ConversationEntity[] = [];
  createCalls: Parameters<ConversationRepositoryPort['create']>[0][] = [];

  async listForUser(userId: string) {
    return this.conversations.filter((c) =>
      c.participants.some((p) => p.userId === userId),
    );
  }
  async findById(id: string) {
    return this.conversations.find((c) => c.id === id) ?? null;
  }
  async isParticipant(conversationId: string, userId: string) {
    const conversation = this.conversations.find(
      (c) => c.id === conversationId,
    );
    return !!conversation?.participants.some((p) => p.userId === userId);
  }
  async create(params: Parameters<ConversationRepositoryPort['create']>[0]) {
    this.createCalls.push(params);
    const conversation = makeConversation({
      id: `conv-${this.conversations.length + 1}`,
      type: params.type,
      name: params.name,
      participants: params.participantIds.map((userId) => ({
        userId,
        role: userId === params.creatorId ? 'owner' : 'member',
        lastReadAt: null,
        user: {
          id: userId,
          username: userId,
          displayName: userId,
          avatarUrl: null,
          status: 'offline',
          statusMessage: null,
          createdAt: new Date(),
        },
      })),
    });
    this.conversations.push(conversation);
    return conversation;
  }
  async findDirectConversationBetween(userAId: string, userBId: string) {
    return (
      this.conversations.find(
        (c) =>
          c.type === 'direct' &&
          c.participants.some((p) => p.userId === userAId) &&
          c.participants.some((p) => p.userId === userBId),
      ) ?? null
    );
  }
  async markRead(conversationId: string, userId: string) {
    const conversation = this.conversations.find(
      (c) => c.id === conversationId,
    );
    const participant = conversation?.participants.find(
      (p) => p.userId === userId,
    );
    if (participant) participant.lastReadAt = new Date();
  }
}

describe('ConversationsService', () => {
  let service: ConversationsService;
  let repository: FakeConversationRepository;

  beforeEach(async () => {
    repository = new FakeConversationRepository();
    const moduleRef = await Test.createTestingModule({
      providers: [
        ConversationsService,
        { provide: CONVERSATION_REPOSITORY, useValue: repository },
      ],
    }).compile();
    service = moduleRef.get(ConversationsService);
  });

  it('creates a new direct conversation between two users', async () => {
    const conversation = await service.create('user-a', ['user-b']);
    expect(conversation.type).toBe('direct');
    expect(repository.createCalls).toHaveLength(1);
  });

  it('reuses an existing direct conversation instead of creating a duplicate', async () => {
    const first = await service.create('user-a', ['user-b']);
    const second = await service.create('user-a', ['user-b']);

    expect(second.id).toBe(first.id);
    expect(repository.createCalls).toHaveLength(1); // only the first call actually created one
  });

  it('creates a group conversation when there are more than two participants', async () => {
    const conversation = await service.create('user-a', ['user-b', 'user-c']);
    expect(conversation.type).toBe('group');
  });

  it('creates a group conversation when a name is given, even for two people', async () => {
    const conversation = await service.create('user-a', ['user-b'], 'Just us');
    expect(conversation.type).toBe('group');
    expect(conversation.name).toBe('Just us');
  });

  it('assertParticipant throws for a non-participant', async () => {
    const conversation = await service.create('user-a', ['user-b']);
    await expect(
      service.assertParticipant(conversation.id, 'user-z'),
    ).rejects.toThrow(NotAConversationParticipantError);
  });

  it('assertParticipant resolves silently for an actual participant', async () => {
    const conversation = await service.create('user-a', ['user-b']);
    await expect(
      service.assertParticipant(conversation.id, 'user-a'),
    ).resolves.toBeUndefined();
  });
});
