/**
 * The browser calls the API on the site's own origin; next.config.ts rewrites /api/v1/* to the
 * API server. Same origin means first-party cookies and no CORS.
 */
export const API_URL = "/api/v1";

export const ROUTES = {
  home: "/",
  explore: "/explore",
  explorePeople: "/explore/people",
  reels: "/reels",
  direct: "/direct",
  /** Redirects to the signed-in user's own profile */
  profile: "/profile",
  editProfile: "/accounts/edit",
  login: "/login",
  register: "/register",
  resetPassword: "/reset-password",
} as const;

export type ProfileTab = "posts" | "reels" | "tagged" | "saved";

/** `/{username}` and its tabs: `/{username}/reels`, `/tagged`, `/saved` */
export function profileRoute(username: string, tab: ProfileTab = "posts") {
  return tab === "posts" ? `/${username}` : `/${username}/${tab}`;
}

/** Instagram's grey silhouette for users without a profile picture */
export const DEFAULT_AVATAR = "/default-avatar.svg";
