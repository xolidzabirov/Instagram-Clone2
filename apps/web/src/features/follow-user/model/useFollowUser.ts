"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "@/shared/i18n";
import { toast } from "@/shared/ui";
import { useSessionStore } from "@/entities/session";
import { applyFollowState, type FollowState } from "@/entities/user";
import { followApi } from "../api/followApi";

export interface FollowTarget {
  id: string;
  username: string;
  avatar: string | null;
  /** Private accounts get a request instead of an instant follow; unknown in some lists */
  isPrivate?: boolean;
}

/** Keeps the signed-in user's "following" counter in step with the change */
function bumpViewerFollowing(delta: number) {
  if (delta === 0) return;
  const { user, setUser } = useSessionStore.getState();
  if (user) setUser({ ...user, followingCount: Math.max(0, user.followingCount + delta) });
}

/**
 * Follow / unfollow with Instagram's instant feedback: every cached place that shows the
 * button or the counters updates at once, and rolls back with a toast if the API refuses.
 */
export function useFollowUser(target: FollowTarget, current: FollowState) {
  const queryClient = useQueryClient();
  const t = useTranslations("follow");
  const viewer = () => useSessionStore.getState().user?.username ?? null;

  const commit = (prev: FollowState, next: FollowState) => {
    applyFollowState(queryClient, target, prev, next, viewer());
    bumpViewerFollowing(Number(next.following) - Number(prev.following));
  };

  const follow = useMutation({
    mutationFn: () => followApi.follow(target.id),
    onMutate: () => {
      const next: FollowState = target.isPrivate
        ? { following: false, followRequested: true }
        : { following: true, followRequested: false };
      commit(current, next);
      return { prev: current, next };
    },
    onSuccess: ({ status }, _vars, context) => {
      // The guess (public / private) may be wrong for list rows: trust the server
      const actual: FollowState =
        status === "ACCEPTED" ? { following: true, followRequested: false } : { following: false, followRequested: true };
      if (context && actual.following !== context.next.following) commit(context.next, actual);
    },
    onError: (_error, _vars, context) => {
      if (context) commit(context.next, context.prev);
      toast.error(t("error"));
    },
  });

  const unfollow = useMutation({
    mutationFn: () => followApi.unfollow(target.id),
    onMutate: () => {
      const next: FollowState = { following: false, followRequested: false };
      commit(current, next);
      return { prev: current, next };
    },
    onError: (_error, _vars, context) => {
      if (context) commit(context.next, context.prev);
      toast.error(t("error"));
    },
  });

  return {
    follow: () => follow.mutate(),
    unfollow: () => unfollow.mutate(),
    isPending: follow.isPending || unfollow.isPending,
  };
}
