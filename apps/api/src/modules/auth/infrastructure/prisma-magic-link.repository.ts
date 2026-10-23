import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../../prisma/prisma.service";
import type {
  MagicLinkRepositoryPort,
  StoredMagicLinkToken
} from "../application/ports/magic-link-repository.port";

@Injectable()
export class PrismaMagicLinkRepository implements MagicLinkRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, tokenHash: string, expiresAt: Date): Promise<StoredMagicLinkToken> {
    return this.prisma.magicLinkToken.create({ data: { userId, tokenHash, expiresAt } });
  }

  async findByHash(tokenHash: string): Promise<StoredMagicLinkToken | null> {
    return this.prisma.magicLinkToken.findUnique({ where: { tokenHash } });
  }

  async markUsed(id: string): Promise<void> {
    await this.prisma.magicLinkToken.update({ where: { id }, data: { usedAt: new Date() } });
  }
}
