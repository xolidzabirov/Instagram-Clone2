import { homedir } from "node:os";
import { join } from "node:path";
import { z } from "zod";

const defaultStorageDir = join(process.env.LOCALAPPDATA ?? join(homedir(), ".local", "share"), "InstagramClone", "media");

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

  /** Base URL clients use to reach this API (upload URLs are built from it) */
  API_PUBLIC_URL: z.string().default("http://localhost:3003"),

  /**
   * "local": files on disk, served by the API at /media-files (no Docker needed).
   * An "s3" driver (MinIO / R2) plugs in behind the same StorageDriver interface later.
   */
  STORAGE_DRIVER: z.enum(["local"]).default("local"),
  STORAGE_LOCAL_DIR: z.string().default(defaultStorageDir),
  /** Public base URL of stored media; absolute URLs stored in media variants are used as-is */
  MEDIA_PUBLIC_URL: z.string().default("http://localhost:3003/media-files"),
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
