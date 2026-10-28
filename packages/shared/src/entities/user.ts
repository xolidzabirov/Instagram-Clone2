/**
 * User entity — shared domain model
 * Used by both UI components and API layer
 */

export type Language = "ru" | "en";
export type UserRole = "USER" | "ADMIN";

export interface UserLink {
  title: string;
  url: string;
}

/** Public profile. Never contains private fields such as email. */
export interface User {
  id: string;
  username: string;
  fullName: string;
  /** null when the user has no avatar: clients show the default silhouette */
  avatar: string | null;
  bio: string;
  links: UserLink[];
  isVerified: boolean;
  isPrivate: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  createdAt: string;
}

export interface UserPreview {
  id: string;
  username: string;
  fullName: string;
  avatar: string;
  isVerified: boolean;
}

/** The signed-in user: public profile plus private account fields */
export interface CurrentUser extends User {
  email: string;
  emailVerified: boolean;
  language: Language;
  role: UserRole;
}
