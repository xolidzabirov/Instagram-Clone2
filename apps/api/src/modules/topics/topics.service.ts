import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import type { Topic, UserTopic } from "@ig/shared";
import { DomainEvents, type PostEngagementEvent } from "../../common/events/events";
import { AppError } from "../../common/errors/app-error";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { PostsService } from "../posts/posts.service";

/** How much one interaction moves the weights of the post's topics */
const NUDGE = { like: 0.05, repost: 0.1, notInterested: -0.2 } as const;

/**
 * «Ваш алгоритм»: per-user topic weights (-1..1) that rank recommendations.
 * Interactions nudge AUTO weights; weights the user set by hand (MANUAL) never move on their own.
 */
@Injectable()
export class TopicsService {
  private readonly logger = new Logger(TopicsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly posts: PostsService
  ) {}

  all(): Promise<Topic[]> {
    return this.prisma.topic.findMany({ orderBy: { slug: "asc" } });
  }

  async mine(userId: string): Promise<UserTopic[]> {
    const rows = await this.prisma.userTopicWeight.findMany({
      where: { userId },
      include: { topic: true },
      orderBy: [{ weight: "desc" }, { topicId: "asc" }],
    });
    return rows.map((row) => ({ topic: row.topic, weight: row.weight, source: row.source }));
  }

  async set(userId: string, topicId: string, weight: number): Promise<UserTopic[]> {
    await this.assertTopic(topicId);
    await this.prisma.userTopicWeight.upsert({
      where: { userId_topicId: { userId, topicId } },
      create: { userId, topicId, weight, source: "MANUAL" },
      update: { weight, source: "MANUAL" },
    });
    return this.mine(userId);
  }

  /** Back to neutral: the topic is learned again from interactions */
  async reset(userId: string, topicId: string): Promise<UserTopic[]> {
    await this.prisma.userTopicWeight.deleteMany({ where: { userId, topicId } });
    return this.mine(userId);
  }

  async notInterested(userId: string, postId: string): Promise<void> {
    await this.posts.accessible(postId, userId);
    await this.prisma.notInterested.createMany({ data: [{ userId, postId }], skipDuplicates: true });
    await this.nudge(userId, postId, NUDGE.notInterested);
  }

  @OnEvent(DomainEvents.PostLiked)
  onLiked(event: PostEngagementEvent) {
    return this.safeNudge(event.userId, event.postId, NUDGE.like);
  }

  @OnEvent(DomainEvents.PostReposted)
  onReposted(event: PostEngagementEvent) {
    return this.safeNudge(event.userId, event.postId, NUDGE.repost);
  }

  private async safeNudge(userId: string, postId: string, delta: number) {
    try {
      await this.nudge(userId, postId, delta);
    } catch (error) {
      this.logger.error(`Topic nudge failed for post ${postId}`, error instanceof Error ? error.stack : error);
    }
  }

  /** One atomic statement: create or adjust AUTO weights of every topic of the post, clamped to -1..1 */
  async nudge(userId: string, postId: string, delta: number): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO user_topic_weights ("userId", "topicId", weight, source, "updatedAt")
      SELECT ${userId}::uuid, pt."topicId", GREATEST(-1, LEAST(1, ${delta} * pt.weight)), 'AUTO', now()
      FROM post_topics pt
      WHERE pt."postId" = ${postId}::uuid
      ON CONFLICT ("userId", "topicId") DO UPDATE
        SET weight = GREATEST(-1, LEAST(1, user_topic_weights.weight + EXCLUDED.weight)),
            "updatedAt" = now()
        WHERE user_topic_weights.source = 'AUTO'`;
  }

  private async assertTopic(topicId: string) {
    const topic = await this.prisma.topic.findUnique({ where: { id: topicId }, select: { id: true } });
    if (!topic) throw new AppError("TOPIC_NOT_FOUND", "Тема не найдена", HttpStatus.NOT_FOUND);
  }
}
