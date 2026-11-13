"use client";

import type { Relationship } from "@ig/shared";
import { useState } from "react";
import { useTranslations } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { Button, ChevronDownIcon } from "@/shared/ui";
import { useFollowUser, type FollowTarget } from "../model/useFollowUser";
import { FollowingSheet } from "./FollowingSheet";
import { UnfollowDialog } from "./UnfollowDialog";

interface FollowButtonProps {
  target: FollowTarget;
  following: boolean;
  followRequested: boolean;
  /** The target follows the viewer: the button says "Follow back" */
  followedBy?: boolean;
  /**
   * "profile": big button, "Following ▾" opens the relationship sheet (needs `relationship`).
   * "list": compact button for follower lists and search.
   * "link": blue text, as in "Suggested for you".
   */
  variant?: "profile" | "list" | "link";
  relationship?: Relationship;
  className?: string;
}

export function FollowButton({
  target,
  following,
  followRequested,
  followedBy = false,
  variant = "list",
  relationship,
  className,
}: FollowButtonProps) {
  const t = useTranslations("follow");
  const { follow, unfollow } = useFollowUser(target, { following, followRequested });
  const [dialog, setDialog] = useState<"unfollow" | "sheet" | null>(null);

  const subscribed = following || followRequested;
  const label = following ? t("following") : followRequested ? t("requested") : followedBy ? t("followBack") : t("follow");

  const handleClick = () => {
    if (!subscribed) return follow();
    setDialog(variant === "profile" && following && relationship ? "sheet" : "unfollow");
  };

  return (
    <>
      {variant === "link" ? (
        <button
          type="button"
          onClick={handleClick}
          className={cn(
            "text-xs font-semibold transition-colors",
            subscribed ? "text-foreground hover:text-muted" : "text-primary hover:text-link",
            className
          )}
        >
          {label}
        </button>
      ) : (
        <Button
          variant={subscribed ? "secondary" : "primary"}
          size={variant === "profile" ? "md" : "sm"}
          onClick={handleClick}
          className={cn(variant === "list" && "min-w-[92px] px-4", className)}
        >
          {label}
          {variant === "profile" && following && <ChevronDownIcon className="-mr-1 size-3.5" />}
        </Button>
      )}

      {dialog === "unfollow" && (
        <UnfollowDialog target={target} requested={followRequested} onConfirm={unfollow} onClose={() => setDialog(null)} />
      )}
      {dialog === "sheet" && relationship && (
        <FollowingSheet
          target={target}
          relationship={relationship}
          onUnfollow={() => setDialog("unfollow")}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  );
}
