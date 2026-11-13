"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { ApiError } from "@/shared/api";
import { postApi, type GridTab } from "./postApi";

export const postKeys = {
  all: ["posts"] as const,
  /** Prefix of every profile grid of one user */
  grids: (username: string) => ["posts", "grid", username.toLowerCase()] as const,
  grid: (username: string, tab: GridTab) => ["posts", "grid", username.toLowerCase(), tab] as const,
};

export function useProfileGrid(username: string, tab: GridTab, enabled = true) {
  return useInfiniteQuery({
    queryKey: postKeys.grid(username, tab),
    queryFn: ({ pageParam }) => postApi.grid(username, tab, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 2,
    enabled,
  });
}
