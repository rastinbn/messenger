import { z } from "zod";

/**
 * Validates process.env at boot. Fails fast with a clear message instead of
 * surfacing confusing errors deep inside Prisma/JWT/Redis clients later.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),

  JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET must be at least 16 characters"),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET must be at least 16 characters"),
  JWT_REFRESH_TTL: z.string().default("30d"),

  CORS_ORIGINS: z.string().default("http://localhost:3000"),

  MEDIA_UPLOAD_DIR: z.string().default("./uploads"),
  MEDIA_MAX_FILE_SIZE_BYTES: z.coerce.number().int().positive().default(10_485_760),

  APP_URL: z.string().default("http://localhost:3000"),
  EMAIL_PROVIDER: z.enum(["console", "smtp"]).default("console"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default("Messenger <no-reply@messenger.local>"),

  STUN_URLS: z.string().default("stun:stun.l.google.com:19302")
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}
