import { Inject, Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";
import { ENV } from "../../config/config.module";
import type { Env } from "../../config/env";
import { PrismaService } from "../../infra/prisma/prisma.service";

const INTERVAL_MS = 10 * 60 * 1000;

/**
 * Recomputes posts.score, the base of recommendations (home feed, Explore, Reels):
 *   score = (1 + ln(1 + likes + 2·comments + 3·saves + 4·reposts + views/20)) / (1 + ageHours/24)^1.2
 * Engagement grows the score logarithmically, age decays it. Only the last 30 days are ranked.
 */
@Injectable()
export class PostScoring implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PostScoring.name);
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(ENV) private readonly env: Env
  ) {}

  onModuleInit() {
    if (this.env.NODE_ENV === "test") return;
    const tick = () => this.recompute().catch((error) => this.logger.error("Post scoring failed", error));
    void tick();
    this.timer = setInterval(tick, INTERVAL_MS);
    this.timer.unref();
  }

  onModuleDestroy() {
    clearInterval(this.timer);
  }

  async recompute(): Promise<number> {
    return this.prisma.$executeRaw`
      UPDATE posts SET score =
        (1 + ln(1 + "likesCount" + 2 * "commentsCount" + 3 * "savesCount" + 4 * "repostsCount" + "viewsCount" / 20.0))
        / power(1 + extract(epoch FROM (now() - "createdAt")) / 86400.0, 1.2)
      WHERE "deletedAt" IS NULL AND "createdAt" > now() - interval '30 days'`;
  }
}
