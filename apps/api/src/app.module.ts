import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { LoggerModule } from "nestjs-pino";
import { randomUUID } from "node:crypto";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { ConfigModule, ENV } from "./config/config.module";
import type { Env } from "./config/env";
import { PrismaModule } from "./infra/prisma/prisma.module";
import { HealthModule } from "./modules/health/health.module";

@Module({
  imports: [
    ConfigModule,
    LoggerModule.forRootAsync({
      inject: [ENV],
      useFactory: (env: Env) => ({
        pinoHttp: {
          level: env.LOG_LEVEL,
          genReqId: (req, res) => {
            const id = (req.headers["x-request-id"] as string | undefined) ?? randomUUID();
            res.setHeader("x-request-id", id);
            return id;
          },
          redact: ["req.headers.authorization", "req.headers.cookie", 'res.headers["set-cookie"]'],
          transport:
            env.NODE_ENV === "development"
              ? { target: "pino-pretty", options: { singleLine: true } }
              : undefined,
        },
      }),
    }),
    ThrottlerModule.forRoot([{ name: "default", ttl: 60_000, limit: 300 }]),
    PrismaModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
