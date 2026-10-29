import type { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import { ENV } from "./config/config.module";
import type { Env } from "./config/env";
import { LocalStorageDriver } from "./infra/storage/local-storage.driver";

export const API_PREFIX = "api/v1";

/** Shared by main.ts and e2e tests so both run the exact same pipeline */
export function setupApp(app: INestApplication) {
  const env = app.get<Env>(ENV);

  app.setGlobalPrefix(API_PREFIX);

  // Stored media (local driver). Registered before helmet so images and videos can be
  // embedded by the web app on another origin; files are immutable (new upload = new key)
  app.use(
    "/media-files",
    express.static(app.get(LocalStorageDriver).root, {
      immutable: true,
      maxAge: "365d",
      index: false,
      setHeaders: (res) => {
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        res.setHeader("X-Content-Type-Options", "nosniff");
      },
    })
  );
  app.use(helmet());
  app.use(cookieParser());
  // The web app talks to the API through Next.js rewrites (same origin);
  // CORS only matters for mobile dev tools and direct Swagger calls
  app.enableCors({ origin: env.CORS_ORIGINS, credentials: true });
  app.enableShutdownHooks();

  if (env.NODE_ENV !== "production") {
    const config = new DocumentBuilder()
      .setTitle("Instagram Clone API")
      .setVersion("1.0")
      .addBearerAuth()
      .build();
    SwaggerModule.setup("api/docs", app, () => SwaggerModule.createDocument(app, config));
  }

  return app;
}
