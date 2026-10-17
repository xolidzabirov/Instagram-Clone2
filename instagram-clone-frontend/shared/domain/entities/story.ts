/**
 * Story entity — shared domain model
 */

import type { UserPreview } from "./user";

export interface Story {
  id: string;
  author: UserPreview;
  items: StoryItem[];
  seenAt?: string;
  expiresAt: string;
  createdAt: string;
}

export interface StoryItem {
  id: string;
  type: "image" | "video";
  url: string;
  duration: number; // seconds
  thumbnailUrl?: string;
}

export interface StoryRing {
  user: UserPreview;
  hasUnseenStories: boolean;
  latestStoryId: string;
}
