import type { AuthResponse, CurrentUser, LoginInput, RegisterRequest } from "@ig/shared";
import { http } from "@/shared/api";

/**
 * Auth endpoints. The refresh token never touches JavaScript: the API keeps it in an
 * httpOnly cookie that the browser sends to /api/v1/auth only.
 */
export const sessionApi = {
  login: (body: LoginInput) => http.post<AuthResponse>("/auth/login", body).then((res) => res.data),
  register: (body: RegisterRequest) => http.post<AuthResponse>("/auth/register", body).then((res) => res.data),
  refresh: () => http.post<AuthResponse>("/auth/refresh", {}).then((res) => res.data),
  logout: () => http.post<void>("/auth/logout").then(() => undefined),
  me: () => http.get<CurrentUser>("/users/me").then((res) => res.data),
};
