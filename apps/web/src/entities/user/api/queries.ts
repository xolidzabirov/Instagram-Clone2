"use client";

import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { ApiError } from "@/shared/api";
import type { SuggestionItem } from "../model/cache";
import { userApi, type FollowListKind } from "./userApi";

export const userKeys = {
  all: ["users"] as const,
  profile: (username: string) => ["users", "profile", username.toLowerCase()] as const,
  /** Prefix of every followers / following list (search queries included) */
  lists: () => ["users", "list"] as const,
  list: (kind: FollowListKind, username: string, q: string) =>
    ["users", "list", kind, username.toLowerCase(), q] as const,
  suggestions: (limit: number) => ["users", "suggestions", limit] as const,
};

/** 404 means "no such user" (or the owner blocked the viewer): retrying will not change that */
const retryUnlessClientError = (failureCount: number, error: unknown) =>
  !(error instanceof ApiError && error.status >= 400 && error.status < 500) && failureCount < 2;

export function useProfile(username: string) {
  return useQuery({
    queryKey: userKeys.profile(username),
    queryFn: () => userApi.profile(username),
    retry: retryUnlessClientError,
  });
}

export function useFollowList(kind: FollowListKind, username: string, q: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: userKeys.list(kind, username, q),
    queryFn: ({ pageParam }) => userApi.followList(kind, username, { cursor: pageParam, q }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    placeholderData: keepPreviousData,
    retry: retryUnlessClientError,
    enabled,
  });
}

export function useSuggestions(limit: number) {
  return useQuery({
    queryKey: userKeys.suggestions(limit),
    queryFn: (): Promise<SuggestionItem[]> => userApi.suggestions(limit),
    staleTime: 5 * 60 * 1000,
  });
}
