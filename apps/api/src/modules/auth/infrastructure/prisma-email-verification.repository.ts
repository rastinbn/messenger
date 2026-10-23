import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../../prisma/prisma.service";
import type {
  EmailVerificationRepositoryPort,
  StoredEmailVerificationToken
} from "../application/ports/email-verification-repository.port";

@Injectable()
export class PrismaEmailVerificationRepository implements EmailVerificationRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, tokenHash: string, expiresAt: Date): Promise<StoredEmailVerificationToken> {
    return this.prisma.emailVerificationToken.create({ data: { userId, tokenHash, expiresAt } });
  }

  async findByHash(tokenHash: string): Promise<StoredEmailVerificationToken | null> {
    return this.prisma.emailVerificationToken.findUnique({ where: { tokenHash } });
  }

  async markUsed(id: string): Promise<void> {
    await this.prisma.emailVerificationToken.update({ where: { id }, data: { usedAt: new Date() } });
  }
}
