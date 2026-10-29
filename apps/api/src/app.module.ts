import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { LoggerModule } from "nestjs-pino";
import { randomUUID } from "node:crypto";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { ConfigModule, ENV } from "./config/config.module";
import type { Env } from "./config/env";
import { MailModule } from "./infra/mail/mail.module";
import { PrismaModule } from "./infra/prisma/prisma.module";
import { QueueModule } from "./infra/queue/queue.module";
import { StorageModule } from "./infra/storage/storage.module";
import { AuthModule } from "./modules/auth/auth.module";
import { HealthModule } from "./modules/health/health.module";
import { MediaModule } from "./modules/media/media.module";
import { PostsModule } from "./modules/posts/posts.module";
import { SocialModule } from "./modules/social/social.module";
import { UsersModule } from "./modules/users/users.module";

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
    ThrottlerModule.forRootAsync({
      inject: [ENV],
      useFactory: (env: Env) => ({
        throttlers: [{ name: "default", ttl: 60_000, limit: 300 }],
        // e2e tests create many accounts from one IP
        skipIf: () => env.NODE_ENV === "test",
      }),
    }),
    EventEmitterModule.forRoot(),
    PrismaModule,
    MailModule,
    StorageModule,
    QueueModule,
    HealthModule,
    AuthModule,
    UsersModule,
    SocialModule,
    MediaModule,
    PostsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
