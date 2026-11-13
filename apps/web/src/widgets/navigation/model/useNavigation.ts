"use client";

import { createContext, useContext } from "react";
import { ROUTES, profileRoute } from "@/shared/config";
import { useSession } from "@/entities/session";
import { useCreatePostModal } from "@/features/create-post";
import { useNavigationStore } from "./useNavigationStore";

/**
 * The current path, provided by AppNavigation. Read through context (not usePathname in every
 * item) so the whole navigation can be prerendered once without an active item while dynamic
 * routes such as /{username} resolve their URL.
 */
export const PathnameContext = createContext<string>("");

export type NavSection = "home" | "search" | "explore" | "reels" | "messages" | "notifications" | "profile";

/** Everything the sidebar, the mobile header and the bottom bar share */
export function useNavigation() {
  const pathname = useContext(PathnameContext);
  const user = useSession();
  const openCreatePost = useCreatePostModal((state) => state.open);
  const { activePanel, togglePanel, closePanel } = useNavigationStore();
  const profileHref = user ? profileRoute(user.username) : ROUTES.profile;
  const onProfile = pathname === profileHref || pathname.startsWith(`${profileHref}/`) || pathname === ROUTES.editProfile;

  // An open panel is the active section, whatever page is underneath
  const active: NavSection | null =
    activePanel ??
    (pathname === ROUTES.home
      ? "home"
      : pathname.startsWith(ROUTES.explore)
        ? "explore"
        : pathname.startsWith(ROUTES.reels)
          ? "reels"
          : pathname.startsWith(ROUTES.direct)
            ? "messages"
            : onProfile
              ? "profile"
              : null);

  return {
    active,
    activePanel,
    togglePanel,
    closePanel,
    createPost: () => {
      closePanel();
      openCreatePost();
    },
    avatar: user?.avatar ?? null,
    profileHref,
    username: user?.username ?? null,
  };
}
