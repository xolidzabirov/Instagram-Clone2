import { http } from "@/shared/api";

export const blockApi = {
  block: (userId: string) => http.put(`/users/${userId}/block`).then(() => undefined),
  unblock: (userId: string) => http.delete(`/users/${userId}/block`).then(() => undefined),
  restrict: (userId: string) => http.put(`/users/${userId}/restrict`).then(() => undefined),
  unrestrict: (userId: string) => http.delete(`/users/${userId}/restrict`).then(() => undefined),
  removeFollower: (userId: string) => http.delete(`/users/${userId}/follower`).then(() => undefined),
};
