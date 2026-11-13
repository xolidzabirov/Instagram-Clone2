import type { FollowListItem, Paginated, Relationship, SuggestedUser, UserProfile } from "@ig/shared";
import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import { userKeys } from "../api/queries";

export interface FollowState {
  following: boolean;
  followRequested: boolean;
}

/**
 * Writes a new follow state for `target` into every cached place that shows it: the target's
 * profile (button + followers count), the viewer's profile (following count) and all
 * followers / following lists. Used for optimistic updates and for rolling them back.
 */
export function applyFollowState(
  queryClient: QueryClient,
  target: { id: string; username: string },
  prev: FollowState,
  next: FollowState,
  viewerUsername: string | null
) {
  const delta = Number(next.following) - Number(prev.following);

  queryClient.setQueryData<UserProfile>(userKeys.profile(target.username), (profile) =>
    profile && profile.relationship
      ? {
          ...profile,
          followersCount: Math.max(0, profile.followersCount + delta),
          // Following a private account (accepted) unlocks its posts; unfollowing hides them again
          canViewContent: profile.isPrivate ? next.following : profile.canViewContent,
          relationship: { ...profile.relationship, ...next },
        }
      : profile
  );

  if (viewerUsername && delta !== 0) {
    queryClient.setQueryData<UserProfile>(userKeys.profile(viewerUsername), (profile) =>
      profile ? { ...profile, followingCount: Math.max(0, profile.followingCount + delta) } : profile
    );
  }

  queryClient.setQueriesData<InfiniteData<Paginated<FollowListItem>>>({ queryKey: userKeys.lists() }, (data) =>
    data
      ? {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            items: page.items.map((item) => (item.id === target.id ? { ...item, ...next } : item)),
          })),
        }
      : data
  );

  // Suggestions stay on screen after a follow, with the button switched to "Following"
  queryClient.setQueriesData<SuggestionItem[]>({ queryKey: ["users", "suggestions"] }, (items) =>
    items?.map((item) => (item.id === target.id ? { ...item, ...next } : item))
  );
}

/** A suggestion plus the follow state the viewer gave it on this page */
export type SuggestionItem = SuggestedUser & Partial<FollowState>;

/** Merges relationship flags (favorite, close friend, mute, block…) into a cached profile */
export function patchRelationship(queryClient: QueryClient, username: string, patch: Partial<Relationship>) {
  queryClient.setQueryData<UserProfile>(userKeys.profile(username), (profile) =>
    profile && profile.relationship ? { ...profile, relationship: { ...profile.relationship, ...patch } } : profile
  );
}

/** Drops a user from cached followers / following lists (removed follower, blocked user) */
export function removeFromFollowLists(queryClient: QueryClient, userId: string) {
  queryClient.setQueriesData<InfiniteData<Paginated<FollowListItem>>>({ queryKey: userKeys.lists() }, (data) =>
    data
      ? { ...data, pages: data.pages.map((page) => ({ ...page, items: page.items.filter((item) => item.id !== userId) })) }
      : data
  );
}
