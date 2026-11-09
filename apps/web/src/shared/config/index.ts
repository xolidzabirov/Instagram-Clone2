export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003/api/v1";

export const ROUTES = {
  home: "/",
  explore: "/explore",
  reels: "/reels",
  direct: "/direct",
  profile: "/profile",
  login: "/login",
  register: "/register",
} as const;

/** Instagram's grey silhouette for users without a profile picture */
export const DEFAULT_AVATAR = "/default-avatar.svg";
