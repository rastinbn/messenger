import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import type { MessageEntity } from '../domain/message.entity';
import type {
  CreateMessageData,
  MessagePage,
  MessageRepositoryPort,
} from '../application/ports/message-repository.port';

const PAGE_SIZE = 50;

/**
 * Every read path returns the same shape: attachments plus a compact quote of
 * the replied-to message (sender name included, so the UI can render the quote
 * without a second lookup).
 */
const messageInclude = Prisma.validator<Prisma.MessageInclude>()({
  attachments: true,
  replyTo: {
    select: {
      id: true,
      content: true,
      senderId: true,
      deletedAt: true,
      sender: { select: { displayName: true } },
    },
  },
});

type MessageRow = Prisma.MessageGetPayload<{ include: typeof messageInclude }>;

function toEntity(row: MessageRow): MessageEntity {
  return {
    id: row.id,
    conversationId: row.conversationId,
    senderId: row.senderId,
    content: row.content,
    status: row.status,
    editedAt: row.editedAt,
    createdAt: row.createdAt,
    deletedAt: row.deletedAt,
    forwarded: row.forwarded,
    replyTo: row.replyTo
      ? {
          id: row.replyTo.id,
          senderId: row.replyTo.senderId,
          senderName: row.replyTo.sender.displayName,
          content: row.replyTo.content,
          deletedAt: row.replyTo.deletedAt,
        }
      : null,
    attachments: row.attachments.map((a) => ({
      id: a.id,
      type: a.type,
      url: a.url,
      fileName: a.fileName,
      mimeType: a.mimeType,
      sizeBytes: a.sizeBytes,
      width: a.width,
      height: a.height,
    })),
  };
}

@Injectable()
export class PrismaMessageRepository implements MessageRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateMessageData): Promise<MessageEntity> {
    // Forwarded attachments are *cloned* (new rows pointing at the same file):
    // an Attachment row belongs to exactly one message, so re-connecting the
    // original ids would move them out of the source conversation.
    const attachmentsWrite = data.cloneAttachments?.length
      ? {
          create: data.cloneAttachments.map((attachment) => ({
            uploaderId: data.senderId,
            type: attachment.type,
            url: attachment.url,
            fileName: attachment.fileName,
            mimeType: attachment.mimeType,
            sizeBytes: attachment.sizeBytes,
            width: attachment.width,
            height: attachment.height,
          })),
        }
      : data.attachmentIds?.length
        ? { connect: data.attachmentIds.map((id) => ({ id })) }
        : undefined;

    const row = await this.prisma.message.create({
      data: {
        conversationId: data.conversationId,
        senderId: data.senderId,
        content: data.content,
        status: 'sent',
        replyToId: data.replyToId ?? null,
        forwarded: data.forwarded ?? false,
        attachments: attachmentsWrite,
      },
      include: messageInclude,
    });
    return toEntity(row);
  }

  async findById(messageId: string): Promise<MessageEntity | null> {
    const row = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: messageInclude,
    });
    return row ? toEntity(row) : null;
  }

  async listByConversation(
    conversationId: string,
    cursor?: string,
    limit = PAGE_SIZE,
  ): Promise<MessagePage> {
    const rows = await this.prisma.message.findMany({
      where: { conversationId },
      include: messageInclude,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    // `.at(-1)` is typed as `T | undefined` regardless of noUncheckedIndexedAccess,
    // which is exactly the honest type here — we only trust it because `hasMore`
    // guarantees non-emptiness, checked explicitly rather than asserted away.
    const lastMessage = page.at(-1);
    const nextCursor = hasMore && lastMessage ? lastMessage.id : null;

    // Return oldest-first for chat rendering, even though we paginate newest-first internally.
    return { messages: page.reverse().map(toEntity), nextCursor };
  }

  async softDelete(messageId: string): Promise<MessageEntity> {
    const [, row] = await this.prisma.$transaction([
      // Attachment rows are content; the files themselves stay on disk so a
      // restore (or an unrelated message referencing the same upload) still works.
      this.prisma.attachment.deleteMany({ where: { messageId } }),
      this.prisma.message.update({
        where: { id: messageId },
        data: { content: '', deletedAt: new Date() },
        include: messageInclude,
      }),
    ]);
    return toEntity(row);
  }

  async touchConversation(conversationId: string): Promise<void> {
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
  }
}
