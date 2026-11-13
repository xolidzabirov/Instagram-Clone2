/**
 * The browser calls the API on the site's own origin; next.config.ts rewrites /api/v1/* to the
 * API server. Same origin means first-party cookies and no CORS.
 */
export const API_URL = "/api/v1";

export const ROUTES = {
  home: "/",
  explore: "/explore",
  reels: "/reels",
  direct: "/direct",
  profile: "/profile",
  login: "/login",
  register: "/register",
  resetPassword: "/reset-password",
} as const;

/** Instagram's grey silhouette for users without a profile picture */
export const DEFAULT_AVATAR = "/default-avatar.svg";
