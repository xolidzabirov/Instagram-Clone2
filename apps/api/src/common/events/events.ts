/**
 * Domain events between modules (@nestjs/event-emitter).
 * Producers never call consumers directly; e.g. notifications (BE-14) listen to these.
 */
export const DomainEvents = {
  UserFollowed: "user.followed",
  FollowRequested: "follow.requested",
  FollowAccepted: "follow.accepted",
  MediaProcessed: "media.processed",
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
