export const REFRESH_TOKEN_REPOSITORY = Symbol('REFRESH_TOKEN_REPOSITORY');

export interface StoredRefreshToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface RefreshTokenRepositoryPort {
  create(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<StoredRefreshToken>;
  findByHash(tokenHash: string): Promise<StoredRefreshToken | null>;
  revoke(id: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
}
