import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../../prisma/prisma.service";

export interface AdminConversationRow {
  id: string;
  type: string;
  name: string | null;
  participantCount: number;
  messageCount: number;
  lastMessageAt: Date | null;
  createdAt: Date;
}

/**
 * Admin-only cross-cutting queries. Deliberately kept separate from
 * ConversationsService/MessagingService's Prisma repositories — those are
 * scoped to "what a participant can see," this is scoped to "what an admin
 * can see," which is a different access pattern (no participant filtering)
 * and shouldn't leak into the regular user-facing repositories.
 */
@Injectable()
export class AdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listConversations(params: {
    page: number;
    pageSize: number;
  }): Promise<{ conversations: AdminConversationRow[]; total: number }> {
    const [rows, total] = await Promise.all([
      this.prisma.conversation.findMany({
        orderBy: { updatedAt: "desc" },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        include: {
          _count: { select: { participants: true, messages: true } },
          messages: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } }
        }
      }),
      this.prisma.conversation.count()
    ]);

    return {
      conversations: rows.map((row) => ({
        id: row.id,
        type: row.type,
        name: row.name,
        participantCount: row._count.participants,
        messageCount: row._count.messages,
        lastMessageAt: row.messages[0]?.createdAt ?? null,
        createdAt: row.createdAt
      })),
      total
    };
  }

  async deleteConversation(id: string): Promise<void> {
    await this.prisma.conversation.delete({ where: { id } });
  }

  async deleteMessage(id: string): Promise<void> {
    await this.prisma.message.delete({ where: { id } });
  }

  async countConversations(): Promise<number> {
    return this.prisma.conversation.count();
  }

  async countMessages(): Promise<number> {
    return this.prisma.message.count();
  }

  async countMessagesSince(since: Date): Promise<number> {
    return this.prisma.message.count({ where: { createdAt: { gte: since } } });
  }
}
