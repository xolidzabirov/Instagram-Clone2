/**
 * Domain events between modules (@nestjs/event-emitter).
 * Producers never call consumers directly; e.g. notifications (BE-14) listen to these.
 */
export const DomainEvents = {
  UserFollowed: "user.followed",
  FollowRequested: "follow.requested",
  FollowAccepted: "follow.accepted",
  MediaProcessed: "media.processed",
  PostCreated: "post.created",
  UserMentioned: "user.mentioned",
  UserTagged: "user.tagged",
  PostLiked: "post.liked",
  PostReposted: "post.reposted",
} as const;

export interface FollowEvent {
  followerId: string;
  followingId: string;
}

export interface MediaProcessedEvent {
  mediaId: string;
  ownerId: string;
  status: "READY" | "FAILED";
}

export interface PostCreatedEvent {
  postId: string;
  authorId: string;
}

export interface UserMentionedEvent {
  actorId: string;
  mentionedUserId: string;
  sourceType: "POST" | "COMMENT" | "STORY";
  sourceId: string;
  postId?: string;
}

export interface UserTaggedEvent {
  actorId: string;
  taggedUserId: string;
  postId: string;
}

/** A user liked or reposted someone's post */
export interface PostEngagementEvent {
  postId: string;
  authorId: string;
  userId: string;
}
