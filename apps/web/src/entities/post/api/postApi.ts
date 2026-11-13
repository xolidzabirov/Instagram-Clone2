import type { Paginated, PostPreview } from "@ig/shared";
import { http } from "@/shared/api";

export type GridTab = "posts" | "reels" | "tagged" | "saved";

export const postApi = {
  /** Profile grids; "saved" is the viewer's own saved posts (all collections) */
  grid: (username: string, tab: GridTab, cursor?: string) => {
    const url = tab === "saved" ? "/users/me/saved" : `/users/${encodeURIComponent(username)}/${tab}`;
    return http.get<Paginated<PostPreview>>(url, { params: { cursor, limit: 24 } }).then((res) => res.data);
  },
};
