import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Same as prisma.config.ts, but pointed at the e2e database from .env.test
config({ path: ".env.test", override: true, quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: env("DATABASE_URL") },
});
