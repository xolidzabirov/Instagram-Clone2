/**
 * Post entity — shared domain model (posts and Reels)
 */

import type { UserPreview } from "./user";

export type PostType = "POST" | "REEL";
export type AspectRatio = "SQUARE" | "PORTRAIT_4_5" | "PORTRAIT_3_4" | "LANDSCAPE" | "VERTICAL_9_16";

export interface PostTag {
  user: UserPreview;
  /** 0..1 relative to the media width */
  x: number;
  /** 0..1 relative to the media height */
  y: number;
}

export interface PostMediaItem {
  id: string;
  type: "IMAGE" | "VIDEO";
  width: number | null;
  height: number | null;
  durationMs: number | null;
  blurhash: string | null;
  altText: string | null;
  /** Image: "1080" | "640" | "320"; video: "mp4" | "poster" | "poster640" | "poster320" */
  urls: Record<string, string>;
  tags: PostTag[];
}

export interface LocationSummary {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
}

export interface Post {
  id: string;
  type: PostType;
  author: UserPreview;
  media: PostMediaItem[];
  caption: string;
  location: LocationSummary | null;
  aspectRatio: AspectRatio;
  /** null when the author hid like counts (only the author still sees the number) */
  likesCount: number | null;
  commentsCount: number;
  viewsCount: number;
  hideLikes: boolean;
  commentsDisabled: boolean;
  isPinned: boolean;
  isArchived: boolean;
  /** Viewer state; false for guests */
  isLiked: boolean;
  isSaved: boolean;
  isReposted: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Profile grid / explore tile */
export interface PostPreview {
  id: string;
  type: PostType;
  thumbnail: string | null;
  blurhash: string | null;
  likesCount: number | null;
  commentsCount: number;
  viewsCount: number;
  isMultiple: boolean;
  isVideo: boolean;
  isPinned: boolean;
}

export type FeedItem = Post;
