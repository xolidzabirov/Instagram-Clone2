import "dotenv/config";
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Logger } from "nestjs-pino";
import { AppModule } from "./app.module";
import { setupApp, API_PREFIX } from "./app.setup";
import { ENV } from "./config/config.module";
import type { Env } from "./config/env";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  setupApp(app);

  const { PORT } = app.get<Env>(ENV);
  await app.listen(PORT);
  app.get(Logger).log(`API ready on http://localhost:${PORT}/${API_PREFIX} (docs: /api/docs)`);
}

void bootstrap();
