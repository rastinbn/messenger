import { z } from "zod";

import { UserSchema } from "./user";

export const LoginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

export const RegisterInputSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(32),
  displayName: z.string().min(1).max(64),
  password: z.string().min(8)
});
export type RegisterInput = z.infer<typeof RegisterInputSchema>;

export const AuthSessionSchema = z.object({
  user: UserSchema,
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresAt: z.string().datetime()
});
export type AuthSession = z.infer<typeof AuthSessionSchema>;
