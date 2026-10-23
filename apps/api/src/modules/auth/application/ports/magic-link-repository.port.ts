export const MAGIC_LINK_REPOSITORY = Symbol("MAGIC_LINK_REPOSITORY");

export interface StoredMagicLinkToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
}

export interface MagicLinkRepositoryPort {
  create(userId: string, tokenHash: string, expiresAt: Date): Promise<StoredMagicLinkToken>;
  findByHash(tokenHash: string): Promise<StoredMagicLinkToken | null>;
  markUsed(id: string): Promise<void>;
}
