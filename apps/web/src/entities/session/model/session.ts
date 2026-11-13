"use client";

import type { AuthResponse, CurrentUser } from "@ig/shared";
import { create } from "zustand";
import { ApiError, configureAuth } from "@/shared/api";
import { sessionApi } from "../api/sessionApi";

export type SessionStatus = "loading" | "authenticated" | "guest";

interface SessionState {
  status: SessionStatus;
  user: CurrentUser | null;
  /** Lives in memory only: never in localStorage, so injected scripts cannot read it */
  accessToken: string | null;
  setSession: (auth: AuthResponse) => void;
  setUser: (user: CurrentUser) => void;
  clear: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  status: "loading",
  user: null,
  accessToken: null,
  setSession: ({ accessToken, user }) => set({ status: "authenticated", accessToken, user }),
  setUser: (user) => set({ user }),
  clear: () => set({ status: "guest", user: null, accessToken: null }),
}));

/** The signed-in user; null while loading or for guests */
export const useSession = () => useSessionStore((state) => state.user);

let refreshing: Promise<string | null> | null = null;

/**
 * Exchanges the refresh cookie for a new access token. Parallel callers share one request:
 * the API rotates the refresh token on every use, so two requests at once would race.
 */
export function refreshSession(): Promise<string | null> {
  refreshing ??= (async () => {
    try {
      const auth = await sessionApi.refresh();
      useSessionStore.getState().setSession(auth);
      return auth.accessToken;
    } catch (error) {
      // Another tab refreshed a moment ago: its new cookie is already in the browser, try once more
      if (error instanceof ApiError && error.code === "REFRESH_TOKEN_STALE") {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        try {
          const auth = await sessionApi.refresh();
          useSessionStore.getState().setSession(auth);
          return auth.accessToken;
        } catch {
          // fall through to "no session"
        }
      }
      useSessionStore.getState().clear();
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

configureAuth({
  getAccessToken: () => useSessionStore.getState().accessToken,
  refresh: refreshSession,
  onSessionLost: () => useSessionStore.getState().clear(),
});
