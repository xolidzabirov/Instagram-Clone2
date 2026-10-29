import { HttpStatus, Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import {
  MAX_PINNED_POSTS,
  type CreatePostInput,
  type Paginated,
  type PaginationInput,
  type Post,
  type PostPreview,
  type PostTagInput,
  type UpdatePostInput,
} from "@ig/shared";
import { v7 as uuidv7 } from "uuid";
import {
  DomainEvents,
  type PostCreatedEvent,
  type UserMentionedEvent,
  type UserTaggedEvent,
} from "../../common/events/events";
import { AppError } from "../../common/errors/app-error";
import { decodeCursor, toPage } from "../../common/pagination/cursor";
import type { Prisma } from "../../generated/prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { PolicyService } from "../users/policy.service";
import { TargetUsers } from "../users/target-users";
import { indexCaption, unindexCaption } from "./caption-indexer";
import { PostPresenter, postInclude, postPreviewInclude, type PostRow } from "./post.presenter";
import { publishedPostWhere, visibleAuthorWhere } from "./post-visibility";

type Tx = Prisma.TransactionClient;
export type GridTab = "posts" | "reels" | "tagged";
export type AccessiblePost = PostRow & { author: PostRow["author"] & { isPrivate: boolean } };

const postNotFound = () => new AppError("POST_NOT_FOUND", "Публикация не найдена", HttpStatus.NOT_FOUND);
const notOwner = () => new AppError("NOT_POST_OWNER", "Only the author can do this", HttpStatus.FORBIDDEN);

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly presenter: PostPresenter,
    private readonly policy: PolicyService,
    private readonly targets: TargetUsers,
    private readonly events: EventEmitter2
  ) {}

  // ─── Create ────────────────────────────────────────────────────────────────

  async create(authorId: string, input: CreatePostInput): Promise<Post> {
    await this.assertMediaUsable(authorId, input);
    if (input.locationId) await this.assertLocation(input.locationId);
    await this.assertTaggable(authorId, input.tags, input.mediaIds);

    const id = uuidv7();
    const mentioned = await this.prisma.$transaction(async (tx) => {
      await tx.post.create({
        data: {
          id,
          authorId,
          type: input.type,
          caption: input.caption,
          locationId: input.locationId,
          aspectRatio: input.type === "REEL" ? "VERTICAL_9_16" : input.aspectRatio,
          hideLikes: input.hideLikes,
          commentsDisabled: input.commentsDisabled,
          media: {
            create: input.mediaIds.map((mediaId, position) => ({
              mediaId,
              position,
              altText: input.altTexts[mediaId] || null,
            })),
          },
        },
      });
      await this.writeTags(tx, id, input.tags);
      await tx.user.update({ where: { id: authorId }, data: { postsCount: { increment: 1 } } });
      if (input.locationId) {
        await tx.location.update({ where: { id: input.locationId }, data: { postsCount: { increment: 1 } } });
      }
      return indexCaption(tx, { id, authorId, caption: input.caption });
    });

    const created: PostCreatedEvent = { postId: id, authorId };
    this.events.emit(DomainEvents.PostCreated, created);
    this.emitMentions(authorId, id, mentioned);
    this.emitTags(authorId, id, input.tags.map((tag) => tag.userId));

    return this.get(id, authorId);
  }

  /** Every media must be the author's own, processed, unused, and fit the post type */
  private async assertMediaUsable(authorId: string, input: CreatePostInput) {
    const media = await this.prisma.media.findMany({
      where: { id: { in: input.mediaIds } },
      select: { id: true, ownerId: true, type: true, purpose: true, status: true, _count: { select: { postMedia: true } } },
    });
    const byId = new Map(media.map((m) => [m.id, m]));
    const invalid = input.mediaIds.filter((mediaId) => {
      const m = byId.get(mediaId);
      if (!m || m.ownerId !== authorId || m.status !== "READY" || m._count.postMedia > 0) return true;
      return input.type === "REEL"
        ? m.type !== "VIDEO" || m.purpose !== "REEL"
        : m.purpose !== "POST" || (m.type !== "IMAGE" && m.type !== "VIDEO");
    });
    if (input.type === "REEL" && input.mediaIds.length !== 1) {
      throw new AppError("INVALID_MEDIA", "A reel has exactly one video", HttpStatus.BAD_REQUEST);
    }
    if (invalid.length > 0) {
      throw new AppError("INVALID_MEDIA", "Media must be your own unused processed uploads", HttpStatus.BAD_REQUEST, {
        mediaIds: invalid,
      });
    }
  }

  private async assertLocation(locationId: string) {
    const location = await this.prisma.location.findUnique({ where: { id: locationId }, select: { id: true } });
    if (!location) throw new AppError("INVALID_LOCATION", "Location not found", HttpStatus.BAD_REQUEST);
  }

  /** Tagged people must exist, be on a slide of this post, and have no block with the author */
  private async assertTaggable(authorId: string, tags: PostTagInput[], mediaIds: string[]) {
    if (tags.length === 0) return;
    const slides = new Set(mediaIds);
    if (tags.some((tag) => !slides.has(tag.mediaId))) {
      throw new AppError("INVALID_TAG", "Tags must point at a slide of this post", HttpStatus.BAD_REQUEST);
    }
    const perSlide = new Map<string, number>();
    for (const tag of tags) perSlide.set(tag.mediaId, (perSlide.get(tag.mediaId) ?? 0) + 1);
    if ([...perSlide.values()].some((count) => count > 20)) {
      throw new AppError("INVALID_TAG", "Up to 20 people per photo", HttpStatus.BAD_REQUEST);
    }

    const userIds = [...new Set(tags.map((tag) => tag.userId))];
    const allowed = await this.prisma.user.count({
      where: {
        id: { in: userIds },
        status: "ACTIVE",
        deletedAt: null,
        blocking: { none: { blockedId: authorId } },
        blockedBy: { none: { blockerId: authorId } },
      },
    });
    if (allowed !== userIds.length) {
      throw new AppError("TAG_NOT_ALLOWED", "Some of these people cannot be tagged", HttpStatus.BAD_REQUEST);
    }
  }

  private async writeTags(tx: Tx, postId: string, tags: PostTagInput[]) {
    await tx.postTag.deleteMany({ where: { postId } });
    if (tags.length > 0) {
      await tx.postTag.createMany({
        data: tags.map((tag) => ({ postId, mediaId: tag.mediaId, userId: tag.userId, x: tag.x, y: tag.y })),
        skipDuplicates: true,
      });
    }
  }

  private emitMentions(actorId: string, postId: string, userIds: string[]) {
    for (const mentionedUserId of userIds) {
      const event: UserMentionedEvent = { actorId, mentionedUserId, sourceType: "POST", sourceId: postId, postId };
      this.events.emit(DomainEvents.UserMentioned, event);
    }
  }

  private emitTags(actorId: string, postId: string, userIds: string[]) {
    for (const taggedUserId of new Set(userIds)) {
      if (taggedUserId === actorId) continue;
      const event: UserTaggedEvent = { actorId, taggedUserId, postId };
      this.events.emit(DomainEvents.UserTagged, event);
    }
  }

  // ─── Read ──────────────────────────────────────────────────────────────────

  async get(postId: string, viewerId: string | null): Promise<Post> {
    return this.presenter.presentOne(await this.accessible(postId, viewerId), viewerId);
  }

  /**
   * Loads a post the viewer may see, or throws 404 (deleted, archived, blocked) /
   * 403 PRIVATE_ACCOUNT. Every action on a post (like, save, comment…) goes through it.
   */
  async accessible(postId: string, viewerId: string | null): Promise<AccessiblePost> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        ...postInclude,
        author: { select: { ...postInclude.author.select, isPrivate: true, status: true, deletedAt: true } },
      },
    });
    if (!post || post.deletedAt || post.author.status !== "ACTIVE" || post.author.deletedAt) throw postNotFound();

    if (viewerId !== post.authorId) {
      if (post.isArchived) throw postNotFound();
      if (await this.policy.isHiddenFrom(viewerId, post.authorId)) throw postNotFound();
      const relationship = viewerId ? await this.policy.relationship(viewerId, post.authorId) : null;
      if (relationship?.blocking) throw postNotFound();
      if (!this.policy.canViewContent(viewerId, { id: post.authorId, isPrivate: post.author.isPrivate }, relationship)) {
        throw new AppError("PRIVATE_ACCOUNT", "This account is private", HttpStatus.FORBIDDEN);
      }
    }
    return post as AccessiblePost;
  }

  /** Profile grid: "posts" (pinned first), "reels", or "tagged" */
  async grid(
    username: string,
    tab: GridTab,
    viewerId: string | null,
    page: PaginationInput
  ): Promise<Paginated<PostPreview>> {
    const owner = await this.targets.byUsername(viewerId, username);
    const relationship = viewerId && viewerId !== owner.id ? await this.policy.relationship(viewerId, owner.id) : null;
    if (!this.policy.canViewContent(viewerId, owner, relationship)) {
      throw new AppError("PRIVATE_ACCOUNT", "This account is private", HttpStatus.FORBIDDEN);
    }

    const where: Prisma.PostWhereInput =
      tab === "tagged"
        ? { ...publishedPostWhere, tags: { some: { userId: owner.id } }, author: visibleAuthorWhere(viewerId) }
        : { ...publishedPostWhere, authorId: owner.id, ...(tab === "reels" && { type: "REEL" }) };

    const cursor = decodeCursor(page.cursor);
    // Pinned posts lead the first page of the posts tab and are skipped afterwards
    const pinned =
      tab === "posts" && !cursor
        ? await this.prisma.post.findMany({
            where: { ...where, pinnedAt: { not: null } },
            orderBy: { pinnedAt: "desc" },
            include: postPreviewInclude,
          })
        : [];

    const rows = await this.prisma.post.findMany({
      where: {
        ...where,
        ...(tab === "posts" && { pinnedAt: null }),
        ...(cursor && {
          AND: [{ OR: [{ createdAt: { lt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { lt: cursor.id } }] }],
        }),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: page.limit + 1,
      include: postPreviewInclude,
    });

    const result = toPage(
      rows,
      page.limit,
      (row) => ({ createdAt: row.createdAt, id: row.id }),
      (pageRows) => pageRows.map((row) => this.presenter.toPreview(row, viewerId))
    );
    return { ...result, items: [...pinned.map((row) => this.presenter.toPreview(row, viewerId)), ...result.items] };
  }

  async archived(authorId: string, page: PaginationInput): Promise<Paginated<PostPreview>> {
    const cursor = decodeCursor(page.cursor);
    const rows = await this.prisma.post.findMany({
      where: {
        authorId,
        deletedAt: null,
        isArchived: true,
        ...(cursor && {
          OR: [{ createdAt: { lt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { lt: cursor.id } }],
        }),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: page.limit + 1,
      include: postPreviewInclude,
    });
    return toPage(
      rows,
      page.limit,
      (row) => ({ createdAt: row.createdAt, id: row.id }),
      (pageRows) => pageRows.map((row) => this.presenter.toPreview(row, authorId))
    );
  }

  // ─── Update ────────────────────────────────────────────────────────────────

  private async owned(authorId: string, postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { media: { select: { mediaId: true } }, tags: { select: { userId: true } } },
    });
    if (!post || post.deletedAt) throw postNotFound();
    if (post.authorId !== authorId) throw notOwner();
    return post;
  }

  async update(authorId: string, postId: string, input: UpdatePostInput): Promise<Post> {
    const post = await this.owned(authorId, postId);
    const mediaIds = post.media.map((m) => m.mediaId);
    if (input.locationId) await this.assertLocation(input.locationId);
    if (input.tags) await this.assertTaggable(authorId, input.tags, mediaIds);

    const previouslyTagged = new Set(post.tags.map((t) => t.userId));
    const mentioned = await this.prisma.$transaction(async (tx) => {
      await tx.post.update({
        where: { id: postId },
        data: {
          ...(input.caption !== undefined && { caption: input.caption }),
          ...(input.locationId !== undefined && { locationId: input.locationId }),
          ...(input.hideLikes !== undefined && { hideLikes: input.hideLikes }),
          ...(input.commentsDisabled !== undefined && { commentsDisabled: input.commentsDisabled }),
        },
      });

      if (input.locationId !== undefined && input.locationId !== post.locationId) {
        if (post.locationId) {
          await tx.location.update({ where: { id: post.locationId }, data: { postsCount: { decrement: 1 } } });
        }
        if (input.locationId) {
          await tx.location.update({ where: { id: input.locationId }, data: { postsCount: { increment: 1 } } });
        }
      }
      if (input.tags) await this.writeTags(tx, postId, input.tags);
      if (input.altTexts) {
        for (const [mediaId, altText] of Object.entries(input.altTexts)) {
          await tx.postMedia.updateMany({ where: { postId, mediaId }, data: { altText: altText || null } });
        }
      }
      return input.caption !== undefined ? indexCaption(tx, { id: postId, authorId, caption: input.caption }) : [];
    });

    this.emitMentions(authorId, postId, mentioned);
    if (input.tags) {
      this.emitTags(authorId, postId, input.tags.map((t) => t.userId).filter((id) => !previouslyTagged.has(id)));
    }
    return this.get(postId, authorId);
  }

  /** Soft delete: the post disappears everywhere, counters and indexes are rolled back */
  async remove(authorId: string, postId: string): Promise<void> {
    const post = await this.owned(authorId, postId);
    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.post.updateMany({
        where: { id: postId, deletedAt: null },
        data: { deletedAt: new Date(), pinnedAt: null },
      });
      if (count === 0) return;
      if (!post.isArchived) {
        await tx.user.update({ where: { id: authorId }, data: { postsCount: { decrement: 1 } } });
      }
      if (post.locationId) {
        await tx.location.update({ where: { id: post.locationId }, data: { postsCount: { decrement: 1 } } });
      }
      await tx.postTag.deleteMany({ where: { postId } });
      await unindexCaption(tx, postId);
    });
  }

  async setArchived(authorId: string, postId: string, archived: boolean): Promise<void> {
    await this.owned(authorId, postId);
    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.post.updateMany({
        where: { id: postId, isArchived: !archived },
        data: { isArchived: archived, ...(archived && { pinnedAt: null }) },
      });
      if (count === 1) {
        await tx.user.update({
          where: { id: authorId },
          data: { postsCount: { increment: archived ? -1 : 1 } },
        });
      }
    });
  }

  async setPinned(authorId: string, postId: string, pinned: boolean): Promise<void> {
    const post = await this.owned(authorId, postId);
    if (!pinned) {
      await this.prisma.post.update({ where: { id: postId }, data: { pinnedAt: null } });
      return;
    }
    if (post.isArchived) {
      throw new AppError("POST_ARCHIVED", "Archived posts cannot be pinned", HttpStatus.CONFLICT);
    }
    if (post.pinnedAt) return;
    const pinnedCount = await this.prisma.post.count({
      where: { authorId, deletedAt: null, pinnedAt: { not: null } },
    });
    if (pinnedCount >= MAX_PINNED_POSTS) {
      throw new AppError("PIN_LIMIT", `You can pin up to ${MAX_PINNED_POSTS} posts`, HttpStatus.CONFLICT);
    }
    await this.prisma.post.update({ where: { id: postId }, data: { pinnedAt: new Date() } });
  }
}
