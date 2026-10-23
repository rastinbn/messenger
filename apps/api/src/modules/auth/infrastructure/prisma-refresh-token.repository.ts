import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';
import type {
  RefreshTokenRepositoryPort,
  StoredRefreshToken,
} from '../application/ports/refresh-token-repository.port';

@Injectable()
export class PrismaRefreshTokenRepository implements RefreshTokenRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<StoredRefreshToken> {
    return await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });
  }

  async findByHash(tokenHash: string): Promise<StoredRefreshToken | null> {
    return await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
  }

  async revoke(id: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
