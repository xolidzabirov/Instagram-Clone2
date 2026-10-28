import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3003),
  /** Comma-separated list of origins allowed to call the API directly (mobile dev tools, Swagger) */
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:3000")
    .transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
    ),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),

  /** HS256 secret for access tokens. Generate: node -e "console.log(crypto.randomBytes(48).toString('base64url'))" */
  JWT_ACCESS_SECRET: z.string().min(32, "must be at least 32 characters"),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(15 * 60),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),

  /** e.g. smtp://localhost:1025 (Mailpit). Without it, emails are written to the log. */
  SMTP_URL: z.string().optional(),
  MAIL_FROM: z.string().default("Instagram Clone <no-reply@instagram.local>"),

  /** Public base URL of the media bucket; absolute URLs stored in media variants are used as-is */
  MEDIA_PUBLIC_URL: z.string().default("http://localhost:9000/instagram"),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${details}`);
  }
  return result.data;
}
