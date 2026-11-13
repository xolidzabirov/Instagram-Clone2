"use client";

import { usePathname } from "next/navigation";
import { ROUTES } from "@/shared/config";
import { useSession } from "@/entities/session";
import { useCreatePostModal } from "@/features/create-post";
import { useNavigationStore } from "./useNavigationStore";

export type NavSection = "home" | "search" | "explore" | "reels" | "messages" | "notifications" | "profile";

/** Everything the sidebar, the mobile header and the bottom bar share */
export function useNavigation() {
  const pathname = usePathname() ?? "";
  const user = useSession();
  const openCreatePost = useCreatePostModal((state) => state.open);
  const { activePanel, togglePanel, closePanel } = useNavigationStore();

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
            : pathname.startsWith(ROUTES.profile)
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
  };
}
