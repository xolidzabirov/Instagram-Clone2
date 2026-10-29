import { Inject, Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";
import { ENV } from "../../config/config.module";
import type { Env } from "../../config/env";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { StorageDriver } from "../../infra/storage/storage.driver";

const HOUR = 60 * 60 * 1000;
const BATCH = 500;

/**
 * Deletes media that was uploaded but never attached to anything within 24 hours
 * (abandoned post drafts, replaced avatars, cancelled messages), including its files.
 */
@Injectable()
export class MediaCleanup implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MediaCleanup.name);
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageDriver,
    @Inject(ENV) private readonly env: Env
  ) {}

  onModuleInit() {
    if (this.env.NODE_ENV === "test") return;
    this.timer = setInterval(() => {
      this.run().catch((error) => this.logger.error("Media cleanup failed", error));
    }, HOUR);
    this.timer.unref();
  }

  onModuleDestroy() {
    clearInterval(this.timer);
  }

  /** Returns how many media items were removed */
  async run(olderThan = new Date(Date.now() - 24 * HOUR)): Promise<number> {
    let removed = 0;
    for (;;) {
      const orphans = await this.prisma.media.findMany({
        where: {
          createdAt: { lt: olderThan },
          avatarOf: null,
          postMedia: { none: {} },
          stories: { none: {} },
          messages: { none: {} },
          highlightCovers: { none: {} },
          conversationAvatar: { none: {} },
          audio: { none: {} },
        },
        select: { id: true, originalKey: true, variants: true },
        take: BATCH,
      });
      if (orphans.length === 0) return removed;

      const keys = orphans.flatMap((media) => [
        media.originalKey,
        ...Object.values((media.variants ?? {}) as Record<string, string>).filter((key) => !/^https?:\/\//.test(key)),
      ]);
      await this.storage.deleteObjects(keys);
      const { count } = await this.prisma.media.deleteMany({ where: { id: { in: orphans.map((m) => m.id) } } });
      removed += count;
      if (orphans.length < BATCH) return removed;
    }
  }
}
