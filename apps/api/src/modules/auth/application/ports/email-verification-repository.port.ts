export const EMAIL_VERIFICATION_REPOSITORY = Symbol("EMAIL_VERIFICATION_REPOSITORY");

export interface StoredEmailVerificationToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
}

export interface EmailVerificationRepositoryPort {
  create(userId: string, tokenHash: string, expiresAt: Date): Promise<StoredEmailVerificationToken>;
  findByHash(tokenHash: string): Promise<StoredEmailVerificationToken | null>;
  markUsed(id: string): Promise<void>;
}
