/**
 * Comment entity — shared domain model
 */

import type { UserPreview } from "./user";

export interface Comment {
  id: string;
  postId: string;
  author: UserPreview;
  text: string;
  likesCount: number;
  isLiked: boolean;
  replies: Comment[];
  repliesCount: number;
  parentId?: string;
  createdAt: string;
}

export interface CreateCommentInput {
  postId: string;
  text: string;
  parentId?: string;
}
