import type { UserPreview } from "@ig/shared";

/**
 * Shape of the mock posts the UI runs on until the feed is wired to the API (FE-8),
 * which replaces it with `Post` from @ig/shared.
 */
export interface MockPost {
  id: string;
  author: UserPreview;
  images: { id: string; url: string; width: number; height: number; altText?: string }[];
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
