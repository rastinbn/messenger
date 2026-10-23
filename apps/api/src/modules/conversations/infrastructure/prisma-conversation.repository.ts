import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import type { ConversationEntity } from '../domain/conversation.entity';
import type { ConversationRepositoryPort } from '../application/ports/conversation-repository.port';

const conversationInclude = {
  participants: { include: { user: true } },
  // Soft-deleted messages keep their row, but they must not become the preview
  // in the conversation list ("you: " with nothing after it).
  messages: {
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' as const },
    take: 1,
  },
} satisfies Prisma.ConversationInclude;

type ConversationRow = Prisma.ConversationGetPayload<{
  include: typeof conversationInclude;
}>;

@Injectable()
export class PrismaConversationRepository implements ConversationRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  private async toEntity(
    row: ConversationRow,
    forUserId: string,
  ): Promise<ConversationEntity> {
    const me = row.participants.find((p) => p.userId === forUserId);
    const lastMessage = row.messages[0] ?? null;

    const unreadCount = await this.prisma.message.count({
      where: {
        conversationId: row.id,
        senderId: { not: forUserId },
        createdAt: me?.lastReadAt ? { gt: me.lastReadAt } : undefined,
      },
    });

    return {
      id: row.id,
      type: row.type,
      name: row.name,
      avatarUrl: row.avatarUrl,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      participants: row.participants.map((p) => ({
        userId: p.userId,
        role: p.role,
        lastReadAt: p.lastReadAt,
        user: {
          id: p.user.id,
          username: p.user.username,
          displayName: p.user.displayName,
          avatarUrl: p.user.avatarUrl,
          status: p.user.status,
          statusMessage: p.user.statusMessage,
          createdAt: p.user.createdAt,
        },
      })),
      lastMessagePreview: lastMessage
        ? lastMessage.senderId === forUserId
          ? `you: ${lastMessage.content}`
          : lastMessage.content
        : null,
      lastMessageAt: lastMessage?.createdAt ?? null,
      unreadCount,
    };
  }

  async listForUser(userId: string): Promise<ConversationEntity[]> {
    const rows = await this.prisma.conversation.findMany({
      where: { participants: { some: { userId } } },
      include: conversationInclude,
      orderBy: { updatedAt: 'desc' },
    });
    return Promise.all(rows.map((row) => this.toEntity(row, userId)));
  }

  async findById(
    id: string,
    forUserId: string,
  ): Promise<ConversationEntity | null> {
    const row = await this.prisma.conversation.findUnique({
      where: { id },
      include: conversationInclude,
    });
    return row ? this.toEntity(row, forUserId) : null;
  }

  async isParticipant(
    conversationId: string,
    userId: string,
  ): Promise<boolean> {
    const count = await this.prisma.conversationParticipant.count({
      where: { conversationId, userId },
    });
    return count > 0;
  }

  async create(params: {
    type: 'direct' | 'group';
    name: string | null;
    participantIds: string[];
    creatorId: string;
  }): Promise<ConversationEntity> {
    const row = await this.prisma.conversation.create({
      data: {
        type: params.type,
        name: params.name,
        participants: {
          create: params.participantIds.map((userId) => ({
            userId,
            role: userId === params.creatorId ? 'owner' : 'member',
          })),
        },
      },
      include: conversationInclude,
    });
    return this.toEntity(row, params.creatorId);
  }

  async findDirectConversationBetween(
    userAId: string,
    userBId: string,
  ): Promise<ConversationEntity | null> {
    const row = await this.prisma.conversation.findFirst({
      where: {
        type: 'direct',
        AND: [
          { participants: { some: { userId: userAId } } },
          { participants: { some: { userId: userBId } } },
        ],
      },
      include: conversationInclude,
    });
    return row ? this.toEntity(row, userAId) : null;
  }

  async markRead(conversationId: string, userId: string): Promise<void> {
    await this.prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    });
  }
}
