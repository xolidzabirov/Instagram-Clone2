/**
 * User entity — shared domain model
 * Used by both UI components and API layer
 */

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  avatar: string;
  bio: string;
  website: string;
  isVerified: boolean;
  isPrivate: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreview {
  id: string;
  username: string;
  fullName: string;
  avatar: string;
  isVerified: boolean;
}

export interface CurrentUser extends User {
  email: string;
  phone?: string;
  notificationsEnabled: boolean;
}
