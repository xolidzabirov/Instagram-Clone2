"use client";

import type { UserPreview } from "@ig/shared";
import Link from "next/link";
import type { ReactNode } from "react";
import { profileRoute } from "@/shared/config";
import { useTranslations } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { Avatar, VerifiedBadge, type AvatarSize } from "@/shared/ui";

interface UserListItemProps {
  user: UserPreview;
  /** Shown under the username; defaults to the full name */
  subtitle?: ReactNode;
  /** Button(s) on the right: Follow, Remove… */
  action?: ReactNode;
  avatarSize?: AvatarSize;
  /** Called when the avatar or name is clicked, e.g. to close the surrounding modal */
  onNavigate?: () => void;
  className?: string;
}

/** Instagram's user row: avatar, bold username with the badge, a muted line and an action */
export function UserListItem({ user, subtitle, action, avatarSize = "md", onNavigate, className }: UserListItemProps) {
  const t = useTranslations("common");
  const href = profileRoute(user.username);

  return (
    <div className={cn("flex items-center gap-3 px-4 py-2", className)}>
      <Link href={href} onClick={onNavigate} tabIndex={-1} aria-hidden>
        <Avatar src={user.avatar} alt="" size={avatarSize} />
      </Link>
      <div className="min-w-0 flex-1 leading-[18px]">
        <Link
          href={href}
          onClick={onNavigate}
          className="flex items-center gap-1 text-sm font-semibold text-foreground hover:opacity-60"
        >
          <span className="truncate">{user.username}</span>
          {user.isVerified && <VerifiedBadge label={t("verified")} className="text-xs" />}
        </Link>
        <div className="truncate text-sm text-muted">{subtitle ?? user.fullName}</div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
