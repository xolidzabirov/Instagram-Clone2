"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ROUTES } from "@/shared/config";
import { useTranslations } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import {
  Avatar,
  CreateIcon,
  ExploreIcon,
  HeartIcon,
  HomeIcon,
  Logo,
  LogoMark,
  MessagesIcon,
  ReelsIcon,
  SearchIcon,
} from "@/shared/ui";
import { useNavigation, type NavSection } from "../model/useNavigation";
import { MoreMenu } from "./MoreMenu";
import { navIconClass, navItemClass, NavLabel } from "./NavItem";

/** Desktop and tablet navigation: 244px with labels from xl, 72px icons-only below */
export function Sidebar() {
  const t = useTranslations("nav");
  const { active, activePanel, togglePanel, closePanel, createPost, avatar, profileHref } = useNavigation();
  const collapsed = activePanel !== null;

  const link = (section: NavSection, href: string, icon: (filled: boolean) => ReactNode) => {
    const isActive = active === section;
    return (
      <Link
        href={href}
        onClick={closePanel}
        aria-label={t(section)}
        aria-current={isActive ? "page" : undefined}
        className={cn(navItemClass, isActive && "font-bold")}
      >
        {icon(isActive)}
        <NavLabel collapsed={collapsed}>{t(section)}</NavLabel>
      </Link>
    );
  };

  const panelButton = (panel: "search" | "notifications", icon: (filled: boolean) => ReactNode) => {
    const isOpen = activePanel === panel;
    return (
      <button
        type="button"
        onClick={() => togglePanel(panel)}
        aria-label={t(panel)}
        aria-expanded={isOpen}
        // Instagram outlines the item whose panel is open
        className={cn(navItemClass, isOpen && "font-bold outline outline-1 -outline-offset-1 outline-separator")}
      >
        {icon(isOpen)}
        <NavLabel collapsed={collapsed}>{t(panel)}</NavLabel>
      </button>
    );
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden w-[72px] flex-col border-r border-separator bg-background px-3 pb-5 pt-2 md:flex",
        !collapsed && "xl:w-[244px]"
      )}
    >
      <Link
        href={ROUTES.home}
        onClick={closePanel}
        aria-label="Instagram"
        className="mb-4 flex h-[73px] shrink-0 items-center px-3 focus-visible:outline-2 focus-visible:outline-primary"
      >
        <LogoMark className={cn(!collapsed && "xl:hidden")} />
        <Logo className={cn("hidden", !collapsed && "xl:block")} />
      </Link>

      <nav aria-label={t("main")} className="flex flex-1 flex-col gap-1">
        {link("home", ROUTES.home, (filled) => <HomeIcon filled={filled} className={navIconClass} />)}
        {panelButton("search", (filled) => <SearchIcon filled={filled} className={navIconClass} />)}
        {link("explore", ROUTES.explore, (filled) => <ExploreIcon filled={filled} className={navIconClass} />)}
        {link("reels", ROUTES.reels, (filled) => <ReelsIcon filled={filled} className={navIconClass} />)}
        {link("messages", ROUTES.direct, (filled) => <MessagesIcon filled={filled} className={navIconClass} />)}
        {panelButton("notifications", (filled) => <HeartIcon filled={filled} className={navIconClass} />)}
        <button type="button" onClick={createPost} aria-label={t("create")} className={navItemClass}>
          <CreateIcon className={navIconClass} />
          <NavLabel collapsed={collapsed}>{t("create")}</NavLabel>
        </button>
        {link("profile", profileHref, (isActive) => (
          <Avatar
            src={avatar}
            alt=""
            size="xs"
            className={cn("transition-transform group-hover:scale-105", isActive && "outline outline-2 outline-foreground")}
          />
        ))}
      </nav>

      <MoreMenu collapsed={collapsed} />
    </aside>
  );
}
