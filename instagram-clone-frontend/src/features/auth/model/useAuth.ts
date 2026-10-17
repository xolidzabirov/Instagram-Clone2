"use client";

import { create } from "zustand";
import { authApi } from "../api/authApi";
import type { User } from "@/shared/domain/entities";
import type { LoginInput, RegisterInput } from "@/shared/domain/validators";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginInput) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (data) => {
    const res = await authApi.login(data);
    localStorage.setItem("access_token", res.accessToken);
    localStorage.setItem("refresh_token", res.refreshToken);
    set({ user: res.user, isAuthenticated: true });
  },

  register: async (data) => {
    const res = await authApi.register(data);
    localStorage.setItem("access_token", res.accessToken);
    localStorage.setItem("refresh_token", res.refreshToken);
    set({ user: res.user, isAuthenticated: true });
  },

  logout: async () => {
    await authApi.logout();
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        set({ isLoading: false });
        return;
      }
      const user = await authApi.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
