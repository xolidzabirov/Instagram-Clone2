import { HttpStatus, Injectable } from "@nestjs/common";
import type { FeedItem, FeedQuery, Paginated } from "@ig/shared";
import { AppError } from "../../common/errors/app-error";
import { decodeCursor, encodeCursor, type Cursor } from "../../common/pagination/cursor";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { PostPresenter, postInclude, type PostRow } from "../posts/post.presenter";
import { publishedPostWhere } from "../posts/post-visibility";

/** Every 5th home feed slot is a suggestion while posts of people you follow last */
const SUGGESTION_EVERY = 5;
const SUGGESTION_WINDOW_DAYS = 30;

/** Home cursor: position in the following stream + how many suggestions were already served */
interface HomeCursor {
  following: Cursor | null;
  followingDone: boolean;
  suggested: number;
}

function encodeHome(cursor: HomeCursor): string {
  return Buffer.from(
    JSON.stringify({
      f: cursor.following ? [cursor.following.createdAt.toISOString(), cursor.following.id] : null,
      d: cursor.followingDone,
      s: cursor.suggested,
    })
  ).toString("base64url");
}

function decodeHome(raw: string | undefined): HomeCursor {
  if (!raw) return { following: null, followingDone: false, suggested: 0 };
  try {
    const { f, d, s } = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as {
      f: [string, string] | null;
      d: boolean;
      s: number;
    };
    if (typeof d !== "boolean" || !Number.isInteger(s) || s < 0) throw new Error("bad cursor");
    const following = f ? { createdAt: new Date(f[0]), id: f[1] } : null;
    if (following && Number.isNaN(following.createdAt.getTime())) throw new Error("bad cursor");
    return { following, followingDone: d, suggested: s };
  } catch {
    throw new AppError("INVALID_CURSOR", "Invalid pagination cursor", HttpStatus.BAD_REQUEST);
  }
}

const afterCursor = (cursor: Cursor | null) =>
  cursor ? { OR: [{ createdAt: { lt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { lt: cursor.id } }] } : {};

@Injectable()
export class FeedService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly presenter: PostPresenter
  ) {}

  async feed(viewerId: string, query: FeedQuery): Promise<Paginated<FeedItem>> {
    return query.mode === "home" ? this.home(viewerId, query) : this.chronological(viewerId, query);
  }

  /** "Following" and "Favorites": strictly newest first, no suggestions */
  private async chronological(viewerId: string, query: FeedQuery): Promise<Paginated<FeedItem>> {
    const cursor = decodeCursor(query.cursor);
    const rows = await this.followingPosts(viewerId, query.mode === "favorites", cursor, query.limit + 1);
    const page = rows.slice(0, query.limit);
    const last = page[page.length - 1];
    return {
      items: await this.present(page, viewerId, new Set()),
      nextCursor: rows.length > query.limit && last ? encodeCursor({ createdAt: last.createdAt, id: last.id }) : null,
    };
  }

  /**
   * Home: posts of people you follow (and your own), newest first, with a suggestion in every
   * 5th slot. When the following stream runs out, the feed continues with suggestions only.
   */
  private async home(viewerId: string, query: FeedQuery): Promise<Paginated<FeedItem>> {
    const cursor = decodeHome(query.cursor);
    const suggestionSlots = Math.floor(query.limit / SUGGESTION_EVERY);
    const followingSlots = query.limit - suggestionSlots;

    const followingRows = cursor.followingDone
      ? []
      : await this.followingPosts(viewerId, false, cursor.following, followingSlots + 1);
    const moreFollowing = followingRows.length > followingSlots;
    const following = followingRows.slice(0, followingSlots);

    const suggestionsNeeded = moreFollowing ? suggestionSlots : query.limit - following.length;
    const suggestedIds = await this.suggestedPostIds(viewerId, cursor.suggested, suggestionsNeeded);
    const suggested = await this.loadInOrder(suggestedIds);

    // Interleave: a suggestion after every 4 posts from people you follow
    const merged: PostRow[] = [];
    const queue = [...suggested];
    following.forEach((post, index) => {
      merged.push(post);
      if ((index + 1) % (SUGGESTION_EVERY - 1) === 0 && queue.length > 0) merged.push(queue.shift()!);
    });
    merged.push(...queue);

    const exhausted = !moreFollowing && suggested.length < suggestionsNeeded;
    const lastFollowing = following[following.length - 1];
    const nextCursor = exhausted
      ? null
      : encodeHome({
          following: lastFollowing ? { createdAt: lastFollowing.createdAt, id: lastFollowing.id } : cursor.following,
          followingDone: !moreFollowing,
          suggested: cursor.suggested + suggested.length,
        });

    return {
      items: await this.present(merged, viewerId, new Set(suggested.map((post) => post.id))),
      nextCursor,
    };
  }

  /** Accounts you follow with posts not muted (plus yourself, except in Favorites) */
  private async followingPosts(viewerId: string, favoritesOnly: boolean, cursor: Cursor | null, take: number) {
    const follows = await this.prisma.follow.findMany({
      where: {
        followerId: viewerId,
        status: "ACCEPTED",
        mutedPosts: false,
        ...(favoritesOnly && { isFavorite: true }),
      },
      select: { followingId: true },
    });
    const authorIds = follows.map((f) => f.followingId);
    if (!favoritesOnly) authorIds.push(viewerId);
    if (authorIds.length === 0) return [];

    return this.prisma.post.findMany({
      where: {
        ...publishedPostWhere,
        authorId: { in: authorIds },
        author: { status: "ACTIVE", deletedAt: null },
        notInterested: { none: { userId: viewerId } },
        ...afterCursor(cursor),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take,
      include: postInclude,
    });
  }

  /**
   * Recent public posts from people you don't follow, ranked by score boosted by your topic
   * weights («Ваш алгоритм»). Skips blocks both ways, "not interested" and posts you already liked.
   */
  private async suggestedPostIds(viewerId: string, offset: number, count: number): Promise<string[]> {
    if (count <= 0) return [];
    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT p.id
      FROM posts p
      JOIN users u ON u.id = p."authorId"
      LEFT JOIN (
        SELECT pt."postId", sum(pt.weight * w.weight) AS boost
        FROM post_topics pt
        JOIN user_topic_weights w ON w."topicId" = pt."topicId" AND w."userId" = ${viewerId}::uuid
        GROUP BY pt."postId"
      ) t ON t."postId" = p.id
      WHERE p."deletedAt" IS NULL AND NOT p."isArchived"
        AND p."createdAt" > now() - make_interval(days => ${SUGGESTION_WINDOW_DAYS})
        AND u.status = 'ACTIVE' AND u."deletedAt" IS NULL AND NOT u."isPrivate"
        AND u.id <> ${viewerId}::uuid
        AND NOT EXISTS (SELECT 1 FROM follows f WHERE f."followerId" = ${viewerId}::uuid AND f."followingId" = u.id)
        AND NOT EXISTS (
          SELECT 1 FROM blocks b
          WHERE (b."blockerId" = ${viewerId}::uuid AND b."blockedId" = u.id)
             OR (b."blockerId" = u.id AND b."blockedId" = ${viewerId}::uuid)
        )
        AND NOT EXISTS (SELECT 1 FROM not_interested n WHERE n."userId" = ${viewerId}::uuid AND n."postId" = p.id)
        AND NOT EXISTS (SELECT 1 FROM post_likes l WHERE l."userId" = ${viewerId}::uuid AND l."postId" = p.id)
      ORDER BY p.score * (1 + GREATEST(coalesce(t.boost, 0), -0.9)) DESC, p.id DESC
      OFFSET ${offset}
      LIMIT ${count}`;
    return rows.map((row) => row.id);
  }

  private async loadInOrder(ids: string[]): Promise<PostRow[]> {
    if (ids.length === 0) return [];
    const rows = await this.prisma.post.findMany({ where: { id: { in: ids } }, include: postInclude });
    const byId = new Map(rows.map((row) => [row.id, row]));
    return ids.flatMap((id) => byId.get(id) ?? []);
  }

  private async present(rows: PostRow[], viewerId: string, suggested: Set<string>): Promise<FeedItem[]> {
    const posts = await this.presenter.present(rows, viewerId);
    return posts.map((post) => ({ ...post, isSuggested: suggested.has(post.id) }));
  }
}
