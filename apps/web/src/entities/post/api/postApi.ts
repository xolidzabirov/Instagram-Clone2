import type {
  CreatePostInput,
  FeedItem,
  FeedMode,
  Paginated,
  Post,
  PostPreview,
  UpdatePostInput,
} from "@ig/shared";
import { http } from "@/shared/api";

export type GridTab = "posts" | "reels" | "tagged" | "saved";

export const postApi = {
  /** Profile grids; "saved" is the viewer's own saved posts (all collections) */
  grid: (username: string, tab: GridTab, cursor?: string) => {
    const url = tab === "saved" ? "/users/me/saved" : `/users/${encodeURIComponent(username)}/${tab}`;
    return http.get<Paginated<PostPreview>>(url, { params: { cursor, limit: 24 } }).then((res) => res.data);
  },
  feed: (mode: FeedMode, cursor?: string) =>
    http.get<Paginated<FeedItem>>("/feed", { params: { mode, cursor, limit: 10 } }).then((res) => res.data),
  get: (id: string) => http.get<Post>(`/posts/${id}`).then((res) => res.data),
  create: (body: CreatePostInput) => http.post<Post>("/posts", body).then((res) => res.data),
  update: (id: string, body: UpdatePostInput) => http.patch<Post>(`/posts/${id}`, body).then((res) => res.data),
  remove: (id: string) => http.delete(`/posts/${id}`).then(() => undefined),
  archive: (id: string) => http.post(`/posts/${id}/archive`).then(() => undefined),
  like: (id: string, value: boolean) =>
    (value ? http.put(`/posts/${id}/like`) : http.delete(`/posts/${id}/like`)).then(
      (res) => res.data as { liked: boolean; likesCount: number | null }
    ),
  save: (id: string, value: boolean) =>
    (value ? http.put(`/posts/${id}/save`, {}) : http.delete(`/posts/${id}/save`)).then(() => undefined),
  repost: (id: string, value: boolean) =>
    (value ? http.put(`/posts/${id}/repost`) : http.delete(`/posts/${id}/repost`)).then(() => undefined),
};
