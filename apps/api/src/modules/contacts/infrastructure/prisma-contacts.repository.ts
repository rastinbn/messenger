import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../../prisma/prisma.service";
import type { PublicUserEntity } from "../../users/domain/user.entity";
import type { ContactsRepositoryPort } from "../application/ports/contacts-repository.port";

@Injectable()
export class PrismaContactsRepository implements ContactsRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string): Promise<PublicUserEntity[]> {
    const links = await this.prisma.contactLink.findMany({
      where: {
        status: "accepted",
        OR: [{ initiatorId: userId }, { recipientId: userId }]
      },
      include: { initiator: true, recipient: true }
    });

    return links.map((link) => {
      const other = link.initiatorId === userId ? link.recipient : link.initiator;
      return {
        id: other.id,
        username: other.username,
        displayName: other.displayName,
        avatarUrl: other.avatarUrl,
        status: other.status,
        statusMessage: other.statusMessage,
        createdAt: other.createdAt
      };
    });
  }

  async add(userId: string, contactUserId: string): Promise<void> {
    // Direction-agnostic uniqueness: don't create a duplicate link if one
    // already exists in either direction.
    const existing = await this.prisma.contactLink.findFirst({
      where: {
        OR: [
          { initiatorId: userId, recipientId: contactUserId },
          { initiatorId: contactUserId, recipientId: userId }
        ]
      }
    });
    if (existing) return;

    await this.prisma.contactLink.create({
      data: { initiatorId: userId, recipientId: contactUserId, status: "accepted" }
    });
  }

  async remove(userId: string, contactUserId: string): Promise<void> {
    await this.prisma.contactLink.deleteMany({
      where: {
        OR: [
          { initiatorId: userId, recipientId: contactUserId },
          { initiatorId: contactUserId, recipientId: userId }
        ]
      }
    });
  }
}
