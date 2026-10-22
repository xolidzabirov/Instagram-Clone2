/**
 * Notification entity — shared domain model
 */

import type { UserPreview } from "./user";

export type NotificationType =
  | "like"
  | "comment"
  | "follow"
  | "mention"
  | "follow_request"
  | "comment_like";

export interface Notification {
  id: string;
  type: NotificationType;
  actor: UserPreview;
  postId?: string;
  postThumbnail?: string;
  commentText?: string;
  isRead: boolean;
  createdAt: string;
}
