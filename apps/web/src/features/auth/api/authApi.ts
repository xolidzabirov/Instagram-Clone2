import type { ForgotPasswordInput, ResetPasswordInput, UsernameAvailability } from "@ig/shared";
import { http } from "@/shared/api";

export const authApi = {
  usernameAvailable: (username: string, signal?: AbortSignal) =>
    http.get<UsernameAvailability>("/auth/username-available", { params: { username }, signal }).then((res) => res.data),
  forgotPassword: (body: ForgotPasswordInput) => http.post("/auth/password/forgot", body).then(() => undefined),
  resetPassword: (body: ResetPasswordInput) => http.post("/auth/password/reset", body).then(() => undefined),
};
