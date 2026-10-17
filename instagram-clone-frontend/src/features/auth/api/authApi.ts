import { apiClient } from "@/shared/lib/apiClient";
import type { LoginInput, RegisterInput } from "@/shared/domain/validators";
import type { User } from "@/shared/domain/entities";

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  login: async (data: LoginInput): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>("/auth/login", data);
    return res.data;
  },

  register: async (data: RegisterInput): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>("/auth/register", data);
    return res.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post("/auth/logout");
  },

  getMe: async (): Promise<User> => {
    const res = await apiClient.get<User>("/users/me");
    return res.data;
  },
};
