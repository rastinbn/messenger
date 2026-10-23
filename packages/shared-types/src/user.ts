import { z } from "zod";

export const UserStatusSchema = z.enum(["online", "away", "offline", "dnd"]);
export type UserStatus = z.infer<typeof UserStatusSchema>;

export const SiteRoleSchema = z.enum(["user", "admin"]);
export type SiteRole = z.infer<typeof SiteRoleSchema>;

export const UserSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(3).max(32),
  displayName: z.string().min(1).max(64),
  avatarUrl: z.string().url().nullable(),
  status: UserStatusSchema,
  statusMessage: z.string().max(140).nullable(),
  emailVerifiedAt: z.string().datetime().nullable().optional(),
  siteRole: SiteRoleSchema.optional(),
  createdAt: z.string().datetime()
});
export type User = z.infer<typeof UserSchema>;

export const PublicUserSchema = UserSchema.pick({
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  status: true,
  statusMessage: true
});
export type PublicUser = z.infer<typeof PublicUserSchema>;
