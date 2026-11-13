"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { profileRoute, type ProfileTab } from "@/shared/config";
import { useTranslations } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { BookmarkIcon, GridIcon, ReelTabIcon, TaggedIcon } from "@/shared/ui";

interface ProfileTabsProps {
  username: string;
  active: ProfileTab;
  /** "Saved" is only on your own profile */
  isMe: boolean;
}

/** Posts · Reels · Saved · Tagged as links (each tab has its own URL, like Instagram) */
export function ProfileTabs({ username, active, isMe }: ProfileTabsProps) {
  const t = useTranslations("profile");

  const tabs: { value: ProfileTab; label: string; icon: ReactNode }[] = [
    { value: "posts", label: t("tabPosts"), icon: <GridIcon /> },
    { value: "reels", label: t("tabReels"), icon: <ReelTabIcon /> },
    ...(isMe ? [{ value: "saved" as const, label: t("tabSaved"), icon: <BookmarkIcon /> }] : []),
    { value: "tagged", label: t("tabTagged"), icon: <TaggedIcon /> },
  ];

  return (
    <nav aria-label={t("tabs")} className="border-t border-separator">
      <ul className="flex justify-around md:justify-center md:gap-[60px]">
        {tabs.map((tab) => {
          const selected = tab.value === active;
          return (
            <li key={tab.value} className="max-md:flex-1">
              <Link
                href={profileRoute(username, tab.value)}
                scroll={false}
                aria-current={selected ? "page" : undefined}
                aria-label={tab.label}
                className={cn(
                  "-mt-px flex h-11 items-center justify-center gap-1.5 border-t text-xs font-semibold uppercase tracking-[1px] md:h-[52px]",
                  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary",
                  selected ? "border-foreground text-foreground" : "border-transparent text-muted hover:text-foreground",
                  "[&>svg]:size-6 md:[&>svg]:size-3"
                )}
              >
                {tab.icon}
                <span className="max-md:hidden">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
