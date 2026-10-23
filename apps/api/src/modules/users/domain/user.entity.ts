import type { UserStatus } from "@messenger/shared-types";

export type SiteRole = "user" | "admin";

/**
 * Domain-level User shape — deliberately independent of Prisma's generated
 * type so the rest of the app never imports from `@prisma/client` directly
 * (that stays confined to the infrastructure layer).
 */
export interface UserEntity {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  displayName: string;
  avatarUrl: string | null;
  status: UserStatus;
  statusMessage: string | null;
  emailVerifiedAt: Date | null;
  siteRole: SiteRole;
  suspendedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type PublicUserEntity = Omit<
  UserEntity,
  "email" | "passwordHash" | "updatedAt" | "emailVerifiedAt" | "siteRole" | "suspendedAt"
>;

export function toPublicUser(user: UserEntity): PublicUserEntity {
  const { id, username, displayName, avatarUrl, status, statusMessage, createdAt } = user;
  return { id, username, displayName, avatarUrl, status, statusMessage, createdAt };
}
