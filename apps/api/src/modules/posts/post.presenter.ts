import { Injectable } from "@nestjs/common";
import type { Post, PostMediaItem, PostPreview, PostTag } from "@ig/shared";
import type { Prisma } from "../../generated/prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { MediaUrlService } from "../../infra/storage/media-url.service";
import { UserPresenter, userPreviewSelect } from "../users/user.presenter";

export const postInclude = {
  author: { select: userPreviewSelect },
  location: { select: { id: true, name: true, city: true, country: true } },
  media: {
    orderBy: { position: "asc" },
    include: {
      media: {
        select: { id: true, type: true, width: true, height: true, durationMs: true, blurhash: true, variants: true },
      },
    },
  },
  tags: { include: { user: { select: userPreviewSelect } } },
} satisfies Prisma.PostInclude;

export type PostRow = Prisma.PostGetPayload<{ include: typeof postInclude }>;

/** Grid tiles only need the first slide */
export const postPreviewInclude = {
  media: {
    orderBy: { position: "asc" },
    take: 1,
    include: { media: { select: { type: true, variants: true, blurhash: true } } },
  },
  _count: { select: { media: true } },
} satisfies Prisma.PostInclude;

export type PostPreviewRow = Prisma.PostGetPayload<{ include: typeof postPreviewInclude }>;

const THUMBNAIL_SIZES = ["640", "poster640", "320", "poster320", "1080", "poster"];

@Injectable()
export class PostPresenter {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UserPresenter,
    private readonly urls: MediaUrlService
  ) {}

  /** Presents many posts with the viewer's like/save/repost flags in three queries total */
  async present(posts: PostRow[], viewerId: string | null): Promise<Post[]> {
    const ids = posts.map((post) => post.id);
    const flags = { liked: new Set<string>(), saved: new Set<string>(), reposted: new Set<string>() };

    if (viewerId && ids.length > 0) {
      const where = { userId: viewerId, postId: { in: ids } };
      const [likes, saves, reposts] = await Promise.all([
        this.prisma.postLike.findMany({ where, select: { postId: true } }),
        this.prisma.savedPost.findMany({ where, select: { postId: true } }),
        this.prisma.repost.findMany({ where, select: { postId: true } }),
      ]);
      likes.forEach((row) => flags.liked.add(row.postId));
      saves.forEach((row) => flags.saved.add(row.postId));
      reposts.forEach((row) => flags.reposted.add(row.postId));
    }

    return posts.map((post) => this.toPost(post, viewerId, flags));
  }

  async presentOne(post: PostRow, viewerId: string | null): Promise<Post> {
    const [presented] = await this.present([post], viewerId);
    return presented!;
  }

  private resolveVariants(variants: unknown): Record<string, string> {
    const map = (variants ?? {}) as Record<string, string>;
    return Object.fromEntries(Object.entries(map).map(([name, key]) => [name, this.urls.resolve(key)]));
  }

  private toPost(
    post: PostRow,
    viewerId: string | null,
    flags: { liked: Set<string>; saved: Set<string>; reposted: Set<string> }
  ): Post {
    const tagsByMedia = new Map<string, PostTag[]>();
    for (const tag of post.tags) {
      const list = tagsByMedia.get(tag.mediaId) ?? [];
      list.push({ user: this.users.toPreview(tag.user), x: tag.x, y: tag.y });
      tagsByMedia.set(tag.mediaId, list);
    }

    const media: PostMediaItem[] = post.media.map(({ media: item, altText }) => ({
      id: item.id,
      type: item.type === "VIDEO" ? "VIDEO" : "IMAGE",
      width: item.width,
      height: item.height,
      durationMs: item.durationMs,
      blurhash: item.blurhash,
      altText,
      urls: this.resolveVariants(item.variants),
      tags: tagsByMedia.get(item.id) ?? [],
    }));

    const isAuthor = viewerId === post.authorId;
    return {
      id: post.id,
      type: post.type,
      author: this.users.toPreview(post.author),
      media,
      caption: post.caption,
      location: post.location,
      aspectRatio: post.aspectRatio,
      likesCount: post.hideLikes && !isAuthor ? null : post.likesCount,
      commentsCount: post.commentsCount,
      viewsCount: post.viewsCount,
      hideLikes: post.hideLikes,
      commentsDisabled: post.commentsDisabled,
      isPinned: post.pinnedAt !== null,
      isArchived: post.isArchived,
      isLiked: flags.liked.has(post.id),
      isSaved: flags.saved.has(post.id),
      isReposted: flags.reposted.has(post.id),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  }

  toPreview(post: PostPreviewRow, viewerId: string | null): PostPreview {
    const first = post.media[0]?.media;
    return {
      id: post.id,
      type: post.type,
      thumbnail: first ? this.urls.pick(first.variants, THUMBNAIL_SIZES) : null,
      blurhash: first?.blurhash ?? null,
      likesCount: post.hideLikes && viewerId !== post.authorId ? null : post.likesCount,
      commentsCount: post.commentsCount,
      viewsCount: post.viewsCount,
      isMultiple: post._count.media > 1,
      isVideo: first?.type === "VIDEO",
      isPinned: post.pinnedAt !== null,
    };
  }
}
