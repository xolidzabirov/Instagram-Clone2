/**
 * Post entity — shared domain model
 */

import type { UserPreview } from "./user";

export interface Post {
  id: string;
  author: UserPreview;
  images: PostImage[];
  caption: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isSaved: boolean;
  location?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PostImage {
  id: string;
  url: string;
  width: number;
  height: number;
  altText?: string;
}

export interface PostPreview {
  id: string;
  thumbnailUrl: string;
  likesCount: number;
  commentsCount: number;
  isMultiple: boolean;
  isVideo: boolean;
}

export type FeedItem = Post;
