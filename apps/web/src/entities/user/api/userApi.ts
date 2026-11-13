import type {
  CurrentUser,
  FollowListItem,
  Paginated,
  SuggestedUser,
  UpdateProfileInput,
  UserProfile,
} from "@ig/shared";
import { http } from "@/shared/api";

export type FollowListKind = "followers" | "following";

export const userApi = {
  profile: (username: string) =>
    http.get<UserProfile>(`/users/${encodeURIComponent(username)}`).then((res) => res.data),
  updateMe: (body: UpdateProfileInput) => http.patch<CurrentUser>("/users/me", body).then((res) => res.data),
  setAvatar: (mediaId: string) => http.put<CurrentUser>("/users/me/avatar", { mediaId }).then((res) => res.data),
  removeAvatar: () => http.delete<CurrentUser>("/users/me/avatar").then((res) => res.data),
  followList: (kind: FollowListKind, username: string, params: { cursor?: string; q?: string }) =>
    http
      .get<Paginated<FollowListItem>>(`/users/${encodeURIComponent(username)}/${kind}`, {
        params: { ...params, q: params.q || undefined, limit: 20 },
      })
      .then((res) => res.data),
  suggestions: (limit: number) =>
    http.get<SuggestedUser[]>("/users/suggestions", { params: { limit } }).then((res) => res.data),
};
