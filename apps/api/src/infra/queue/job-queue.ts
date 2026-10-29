import { Injectable, Logger, type OnApplicationShutdown } from "@nestjs/common";

export type JobHandler<T> = (payload: T) => Promise<void>;

export interface JobOptions {
  /** Total tries including the first one */
  attempts?: number;
}

/**
 * Background jobs behind one interface. This in-process implementation runs jobs right
 * after the request returns, with retries; a BullMQ (Redis) implementation replaces it
 * when Docker is available, so jobs survive restarts and spread across workers.
 */
@Injectable()
export class JobQueue implements OnApplicationShutdown {
  private readonly logger = new Logger(JobQueue.name);
  private readonly handlers = new Map<string, JobHandler<unknown>>();
  private readonly running = new Set<Promise<void>>();

  register<T>(name: string, handler: JobHandler<T>) {
    this.handlers.set(name, handler as JobHandler<unknown>);
  }

  enqueue<T>(name: string, payload: T, options: JobOptions = {}) {
    const handler = this.handlers.get(name);
    if (!handler) throw new Error(`No handler registered for job "${name}"`);

    const job = this.run(name, handler, payload, options.attempts ?? 3).finally(() => this.running.delete(job));
    this.running.add(job);
  }

  private async run(name: string, handler: JobHandler<unknown>, payload: unknown, attempts: number) {
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        await handler(payload);
        return;
      } catch (error) {
        if (attempt === attempts) {
          this.logger.error(`Job "${name}" failed after ${attempts} attempts`, error instanceof Error ? error.stack : error);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 200 * 2 ** attempt));
      }
    }
  }

  /** Waits for in-flight jobs (graceful shutdown, tests) */
  async drain() {
    while (this.running.size > 0) await Promise.allSettled([...this.running]);
  }

  async onApplicationShutdown() {
    await this.drain();
  }
}
