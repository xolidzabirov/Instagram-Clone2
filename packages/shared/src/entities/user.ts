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
  avatar: string | null;
  isVerified: boolean;
}

/** The signed-in user: public profile plus private account fields */
export interface CurrentUser extends User {
  email: string;
  emailVerified: boolean;
  language: Language;
  role: UserRole;
}

/** How the viewer relates to a profile owner */
export interface Relationship {
  /** Viewer follows the owner (accepted) */
  following: boolean;
  /** Viewer sent a follow request that is still pending */
  followRequested: boolean;
  /** Owner follows the viewer */
  followedBy: boolean;
  /** Viewer blocked the owner */
  blocking: boolean;
  /** Owner is in the viewer's close friends list */
  isCloseFriend: boolean;
  /** Viewer added the owner to Favorites */
  isFavorite: boolean;
  mutedPosts: boolean;
  mutedStories: boolean;
}

/** GET /users/:username */
export interface UserProfile extends User {
  isMe: boolean;
  /** False for private accounts the viewer does not follow: hide posts, show "This account is private" */
  canViewContent: boolean;
  /** null for guests and for the viewer's own profile */
  relationship: Relationship | null;
}

/** Row of follower/following lists: Instagram shows a Follow button on each */
export interface FollowListItem extends UserPreview {
  isMe: boolean;
  /** The viewer follows this user */
  following: boolean;
  followRequested: boolean;
}

export interface SuggestedUser extends UserPreview {
  /** How many people the viewer follows also follow this user */
  mutualCount: number;
}

export interface FollowRequest {
  user: UserPreview;
  createdAt: string;
}

export type FollowStatus = "ACCEPTED" | "PENDING";
