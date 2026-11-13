"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ROUTES } from "@/shared/config";
import { useTranslations } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import {
  Avatar,
  CreateIcon,
  HeartIcon,
  HomeIcon,
  IconButton,
  Logo,
  MessagesIcon,
  ReelsIcon,
  SearchIcon,
} from "@/shared/ui";
import { useNavigation, type NavSection } from "../model/useNavigation";

/** Top bar on phones: logo, create and notifications */
export function MobileHeader() {
  const t = useTranslations("nav");
  const { activePanel, togglePanel, closePanel, createPost } = useNavigation();
  const notificationsOpen = activePanel === "notifications";

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-separator bg-background px-4 md:hidden">
      <Link href={ROUTES.home} onClick={closePanel} aria-label="Instagram" className="flex items-center">
        <Logo className="text-[26px]" />
      </Link>
      <div className="flex items-center gap-1">
        <IconButton aria-label={t("create")} onClick={createPost}>
          <CreateIcon className="size-6" />
        </IconButton>
        <IconButton
          aria-label={t("notifications")}
          aria-expanded={notificationsOpen}
          onClick={() => togglePanel("notifications")}
        >
          <HeartIcon filled={notificationsOpen} className="size-6" />
        </IconButton>
      </div>
    </header>
  );
}

/** Bottom bar on phones in Instagram's 2025–2026 order: Home · Reels · Direct · Search · Profile */
export function BottomNav() {
  const t = useTranslations("nav");
  const { active, closePanel, avatar } = useNavigation();

  const item = (section: NavSection, href: string, icon: (filled: boolean) => ReactNode) => {
    const isActive = active === section;
    return (
      <Link
        href={href}
        onClick={closePanel}
        aria-label={t(section)}
        aria-current={isActive ? "page" : undefined}
        className="flex h-full flex-1 items-center justify-center text-foreground transition-transform active:scale-90 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
      >
        {icon(isActive)}
      </Link>
    );
  };

  return (
    <nav
      aria-label={t("main")}
      // The safe-area padding keeps the bar above the iPhone home indicator
      className="fixed inset-x-0 bottom-0 z-40 flex h-12 box-content items-center border-t border-separator bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {item("home", ROUTES.home, (filled) => <HomeIcon filled={filled} className="size-6" />)}
      {item("reels", ROUTES.reels, (filled) => <ReelsIcon filled={filled} className="size-6" />)}
      {item("messages", ROUTES.direct, (filled) => <MessagesIcon filled={filled} className="size-6" />)}
      {/* Search lives on the Explore page on phones */}
      {item("explore", ROUTES.explore, (filled) => <SearchIcon filled={filled} className="size-6" />)}
      {item("profile", ROUTES.profile, (isActive) => (
        <Avatar src={avatar} alt="" size="xs" className={cn(isActive && "outline outline-2 outline-foreground")} />
      ))}
    </nav>
  );
}
