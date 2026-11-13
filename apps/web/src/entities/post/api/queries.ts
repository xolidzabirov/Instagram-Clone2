"use client";

import type { FeedMode } from "@ig/shared";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { ApiError } from "@/shared/api";
import { postApi, type GridTab } from "./postApi";

export const postKeys = {
  all: ["posts"] as const,
  /** Prefix of every profile grid */
  allGrids: () => ["posts", "grid"] as const,
  /** Prefix of every profile grid of one user */
  grids: (username: string) => ["posts", "grid", username.toLowerCase()] as const,
  grid: (username: string, tab: GridTab) => ["posts", "grid", username.toLowerCase(), tab] as const,
  detail: (id: string) => ["posts", "detail", id] as const,
  /** Prefix of every feed mode */
  feeds: () => ["feed"] as const,
  feed: (mode: FeedMode) => ["feed", mode] as const,
};

/** 4xx answers (not found, private, blocked) will not change on retry */
const retryUnlessClientError = (count: number, error: unknown) =>
  !(error instanceof ApiError && error.status < 500) && count < 2;

export function useProfileGrid(username: string, tab: GridTab, enabled = true) {
  return useInfiniteQuery({
    queryKey: postKeys.grid(username, tab),
    queryFn: ({ pageParam }) => postApi.grid(username, tab, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    retry: retryUnlessClientError,
    enabled,
  });
}

export function useFeed(mode: FeedMode) {
  return useInfiniteQuery({
    queryKey: postKeys.feed(mode),
    queryFn: ({ pageParam }) => postApi.feed(mode, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    // The feed is ranked on the server; a background refetch would reorder what you are reading
    staleTime: 5 * 60 * 1000,
  });
}

export function usePost(id: string) {
  return useQuery({
    queryKey: postKeys.detail(id),
    queryFn: () => postApi.get(id),
    retry: retryUnlessClientError,
  });
}
