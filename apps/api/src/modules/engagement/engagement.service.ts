import { HttpStatus, Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import type { FollowListItem, Paginated, PaginationInput, PostPreview, SavedPostsQuery } from "@ig/shared";
import { DomainEvents, type PostEngagementEvent } from "../../common/events/events";
import { AppError } from "../../common/errors/app-error";
import { decodeCursor, toPage } from "../../common/pagination/cursor";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { PostPresenter, postPreviewInclude } from "../posts/post.presenter";
import { publishedPostWhere, visibleAuthorWhere } from "../posts/post-visibility";
import { PostsService } from "../posts/posts.service";
import { PolicyService } from "../users/policy.service";
import { TargetUsers } from "../users/target-users";
import { UserPresenter, userPreviewSelect } from "../users/user.presenter";

export interface LikeState {
  liked: boolean;
  /** null when the author hid like counts */
  likesCount: number | null;
}

/** Keyset condition on (createdAt, <id field>) */
const after = (cursor: ReturnType<typeof decodeCursor>, idField: "userId" | "postId") =>
  cursor ? { OR: [{ createdAt: { lt: cursor.createdAt } }, { createdAt: cursor.createdAt, [idField]: { lt: cursor.id } }] } : {};

@Injectable()
export class EngagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly posts: PostsService,
    private readonly postPresenter: PostPresenter,
    private readonly users: UserPresenter,
    private readonly policy: PolicyService,
    private readonly targets: TargetUsers,
    private readonly events: EventEmitter2
  ) {}

  private emit(name: string, postId: string, authorId: string, userId: string) {
    if (authorId === userId) return;
    const event: PostEngagementEvent = { postId, authorId, userId };
    this.events.emit(name, event);
  }

  private async likeState(postId: string, viewerId: string, liked: boolean): Promise<LikeState> {
    const post = await this.prisma.post.findUniqueOrThrow({
      where: { id: postId },
      select: { likesCount: true, hideLikes: true, authorId: true },
    });
    return { liked, likesCount: post.hideLikes && post.authorId !== viewerId ? null : post.likesCount };
  }

  // ─── Likes ─────────────────────────────────────────────────────────────────

  async like(userId: string, postId: string): Promise<LikeState> {
    const post = await this.posts.accessible(postId, userId);
    const added = await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.postLike.createMany({ data: [{ userId, postId }], skipDuplicates: true });
      if (count === 1) await tx.post.update({ where: { id: postId }, data: { likesCount: { increment: 1 } } });
      return count === 1;
    });
    if (added) this.emit(DomainEvents.PostLiked, postId, post.authorId, userId);
    return this.likeState(postId, userId, true);
  }

  /** Unliking works even if the post became invisible, so nothing is ever stuck */
  async unlike(userId: string, postId: string): Promise<LikeState> {
    await this.assertExists(postId);
    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.postLike.deleteMany({ where: { userId, postId } });
      if (count === 1) await tx.post.update({ where: { id: postId }, data: { likesCount: { decrement: 1 } } });
    });
    return this.likeState(postId, userId, false);
  }

  async likers(viewerId: string, postId: string, page: PaginationInput): Promise<Paginated<FollowListItem>> {
    await this.posts.accessible(postId, viewerId);
    const cursor = decodeCursor(page.cursor);
    const rows = await this.prisma.postLike.findMany({
      where: {
        postId,
        user: {
          status: "ACTIVE",
          deletedAt: null,
          blocking: { none: { blockedId: viewerId } },
          blockedBy: { none: { blockerId: viewerId } },
        },
        ...after(cursor, "userId"),
      },
      orderBy: [{ createdAt: "desc" }, { userId: "desc" }],
      take: page.limit + 1,
      select: { createdAt: true, user: { select: userPreviewSelect } },
    });
    const statuses = await this.policy.followStatuses(viewerId, rows.map((row) => row.user.id));
    return toPage(
      rows,
      page.limit,
      (row) => ({ createdAt: row.createdAt, id: row.user.id }),
      (pageRows) =>
        pageRows.map(({ user }) => ({
          ...this.users.toPreview(user),
          isMe: user.id === viewerId,
          following: statuses.get(user.id) === "ACCEPTED",
          followRequested: statuses.get(user.id) === "PENDING",
        }))
    );
  }

  // ─── Saves ─────────────────────────────────────────────────────────────────

  /** Saves the post, or moves an already saved post into another collection */
  async save(userId: string, postId: string, collectionId?: string | null): Promise<{ saved: true; collectionId: string | null }> {
    await this.posts.accessible(postId, userId);
    if (collectionId) await this.assertOwnCollection(userId, collectionId);

    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.savedPost.createMany({
        data: [{ userId, postId, collectionId: collectionId ?? null }],
        skipDuplicates: true,
      });
      if (count === 1) {
        await tx.post.update({ where: { id: postId }, data: { savesCount: { increment: 1 } } });
      } else if (collectionId !== undefined) {
        await tx.savedPost.update({ where: { userId_postId: { userId, postId } }, data: { collectionId } });
      }
    });
    const saved = await this.prisma.savedPost.findUniqueOrThrow({ where: { userId_postId: { userId, postId } } });
    return { saved: true, collectionId: saved.collectionId };
  }

  async unsave(userId: string, postId: string): Promise<void> {
    await this.assertExists(postId);
    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.savedPost.deleteMany({ where: { userId, postId } });
      if (count === 1) await tx.post.update({ where: { id: postId }, data: { savesCount: { decrement: 1 } } });
    });
  }

  /** "Saved" tab: only posts the viewer can still see */
  async saved(userId: string, query: SavedPostsQuery): Promise<Paginated<PostPreview>> {
    if (query.collectionId) await this.assertOwnCollection(userId, query.collectionId);
    const cursor = decodeCursor(query.cursor);
    const rows = await this.prisma.savedPost.findMany({
      where: {
        userId,
        ...(query.collectionId && { collectionId: query.collectionId }),
        post: { ...publishedPostWhere, author: visibleAuthorWhere(userId) },
        ...after(cursor, "postId"),
      },
      orderBy: [{ createdAt: "desc" }, { postId: "desc" }],
      take: query.limit + 1,
      select: { createdAt: true, post: { include: postPreviewInclude } },
    });
    return toPage(
      rows,
      query.limit,
      (row) => ({ createdAt: row.createdAt, id: row.post.id }),
      (pageRows) => pageRows.map((row) => this.postPresenter.toPreview(row.post, userId))
    );
  }

  // ─── Reposts ───────────────────────────────────────────────────────────────

  async repost(userId: string, postId: string): Promise<void> {
    const post = await this.posts.accessible(postId, userId);
    if (post.authorId === userId) {
      throw new AppError("CANNOT_REPOST_OWN", "You cannot repost your own post", HttpStatus.BAD_REQUEST);
    }
    if (post.author.isPrivate) {
      throw new AppError("CANNOT_REPOST_PRIVATE", "Posts of private accounts cannot be reposted", HttpStatus.FORBIDDEN);
    }
    const added = await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.repost.createMany({ data: [{ userId, postId }], skipDuplicates: true });
      if (count === 1) await tx.post.update({ where: { id: postId }, data: { repostsCount: { increment: 1 } } });
      return count === 1;
    });
    if (added) this.emit(DomainEvents.PostReposted, postId, post.authorId, userId);
  }

  async unrepost(userId: string, postId: string): Promise<void> {
    await this.assertExists(postId);
    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.repost.deleteMany({ where: { userId, postId } });
      if (count === 1) await tx.post.update({ where: { id: postId }, data: { repostsCount: { decrement: 1 } } });
    });
  }

  /** Reposts tab of a profile */
  async reposts(username: string, viewerId: string | null, page: PaginationInput): Promise<Paginated<PostPreview>> {
    const owner = await this.targets.byUsername(viewerId, username);
    const relationship = viewerId && viewerId !== owner.id ? await this.policy.relationship(viewerId, owner.id) : null;
    if (!this.policy.canViewContent(viewerId, owner, relationship)) {
      throw new AppError("PRIVATE_ACCOUNT", "This account is private", HttpStatus.FORBIDDEN);
    }
    const cursor = decodeCursor(page.cursor);
    const rows = await this.prisma.repost.findMany({
      where: {
        userId: owner.id,
        post: { ...publishedPostWhere, author: visibleAuthorWhere(viewerId) },
        ...after(cursor, "postId"),
      },
      orderBy: [{ createdAt: "desc" }, { postId: "desc" }],
      take: page.limit + 1,
      select: { createdAt: true, post: { include: postPreviewInclude } },
    });
    return toPage(
      rows,
      page.limit,
      (row) => ({ createdAt: row.createdAt, id: row.post.id }),
      (pageRows) => pageRows.map((row) => this.postPresenter.toPreview(row.post, viewerId))
    );
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private async assertExists(postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
    if (!post) throw new AppError("POST_NOT_FOUND", "Публикация не найдена", HttpStatus.NOT_FOUND);
  }

  async assertOwnCollection(userId: string, collectionId: string) {
    const collection = await this.prisma.collection.findUnique({ where: { id: collectionId }, select: { userId: true } });
    if (!collection || collection.userId !== userId) {
      throw new AppError("COLLECTION_NOT_FOUND", "Подборка не найдена", HttpStatus.NOT_FOUND);
    }
  }
}
