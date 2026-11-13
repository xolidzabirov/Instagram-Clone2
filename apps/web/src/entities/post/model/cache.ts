import type { FeedItem, Paginated, Post, PostPreview } from "@ig/shared";
import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import { postKeys } from "../api/queries";

type PostPatch = Partial<Pick<Post, "isLiked" | "likesCount" | "isSaved" | "isReposted" | "hideLikes" | "commentsDisabled" | "commentsCount">>;

/**
 * Applies a change to one post wherever it is cached: its page, every feed and the profile grids
 * (which only show the counters). Returns the previous values for a rollback.
 */
export function patchPost(queryClient: QueryClient, id: string, patch: (post: Post) => PostPatch) {
  queryClient.setQueryData<Post>(postKeys.detail(id), (post) => (post ? { ...post, ...patch(post) } : post));

  queryClient.setQueriesData<InfiniteData<Paginated<FeedItem>>>({ queryKey: postKeys.feeds() }, (data) =>
    data
      ? {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            items: page.items.map((item) => (item.id === id ? { ...item, ...patch(item) } : item)),
          })),
        }
      : data
  );
}

/** Keeps grid tiles' hover counters in step with likes and comments */
export function patchPreview(queryClient: QueryClient, id: string, patch: Partial<Pick<PostPreview, "likesCount" | "commentsCount">>) {
  queryClient.setQueriesData<InfiniteData<Paginated<PostPreview>>>({ queryKey: postKeys.allGrids() }, (data) =>
    data
      ? {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            items: page.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
          })),
        }
      : data
  );
}

/** Drops a deleted or archived post from feeds and grids */
export function removePost(queryClient: QueryClient, id: string) {
  const drop = <T extends { id: string }>(data: InfiniteData<Paginated<T>> | undefined) =>
    data
      ? { ...data, pages: data.pages.map((page) => ({ ...page, items: page.items.filter((item) => item.id !== id) })) }
      : data;
  queryClient.setQueriesData<InfiniteData<Paginated<FeedItem>>>({ queryKey: postKeys.feeds() }, drop);
  queryClient.setQueriesData<InfiniteData<Paginated<PostPreview>>>({ queryKey: postKeys.allGrids() }, drop);
  queryClient.removeQueries({ queryKey: postKeys.detail(id) });
}

/** Puts a just-published post at the top of the home and following feeds */
export function prependToFeeds(queryClient: QueryClient, post: Post) {
  const item: FeedItem = { ...post, isSuggested: false };
  for (const mode of ["home", "following"] as const) {
    queryClient.setQueryData<InfiniteData<Paginated<FeedItem>>>(postKeys.feed(mode), (data) =>
      data && data.pages.length > 0
        ? { ...data, pages: [{ ...data.pages[0], items: [item, ...data.pages[0].items] }, ...data.pages.slice(1)] }
        : data
    );
  }
  queryClient.setQueryData(postKeys.detail(post.id), post);
}
