import type { FollowStatus, RelationshipUpdateInput } from "@ig/shared";
import { http } from "@/shared/api";

export const followApi = {
  follow: (userId: string) =>
    http.post<{ status: FollowStatus }>(`/users/${userId}/follow`).then((res) => res.data),
  /** Unfollows, or cancels a pending request */
  unfollow: (userId: string) => http.delete(`/users/${userId}/follow`).then(() => undefined),
  updateRelationship: (userId: string, body: RelationshipUpdateInput) =>
    http.patch(`/users/${userId}/relationship`, body).then(() => undefined),
  setCloseFriend: (userId: string, value: boolean) =>
    (value ? http.put(`/close-friends/${userId}`) : http.delete(`/close-friends/${userId}`)).then(() => undefined),
};
