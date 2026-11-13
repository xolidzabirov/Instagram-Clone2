"use client";

import type { Relationship } from "@ig/shared";
import { useState, type ReactNode } from "react";
import { useTranslations } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { Avatar, ChevronRightIcon, Modal, StarIcon } from "@/shared/ui";
import { useRelationshipToggles } from "../model/useRelationshipToggles";
import type { FollowTarget } from "../model/useFollowUser";

interface FollowingSheetProps {
  target: FollowTarget;
  relationship: Relationship;
  onUnfollow: () => void;
  onClose: () => void;
}

function Row({ children, onClick, trailing }: { children: ReactNode; onClick: () => void; trailing?: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-12 w-full items-center justify-between px-4 text-left text-sm transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
    >
      <span>{children}</span>
      {trailing}
    </button>
  );
}

function Switch({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative h-6 w-10 rounded-full transition-colors",
        checked ? "bg-foreground" : "bg-stroke"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 size-5 rounded-full bg-background shadow transition-[left]",
          checked ? "left-[18px]" : "left-0.5"
        )}
      />
    </span>
  );
}

/** What "Following ▾" opens on a profile: close friends, favorites, mute and unfollow */
export function FollowingSheet({ target, relationship, onUnfollow, onClose }: FollowingSheetProps) {
  const t = useTranslations("follow");
  const toggle = useRelationshipToggles(target);
  const [muteOpen, setMuteOpen] = useState(false);

  return (
    <Modal open onClose={onClose} ariaLabel={target.username} size="sm">
      <div className="flex flex-col items-center gap-3 border-b border-separator py-5">
        <Avatar src={target.avatar} alt="" size="lg" />
        <span className="text-sm font-semibold">{target.username}</span>
      </div>

      {muteOpen ? (
        <div role="group" aria-label={t("mute")}>
          <Row onClick={() => setMuteOpen(false)} trailing={<span className="text-sm text-muted">{t("mute")}</span>}>
            <ChevronRightIcon className="size-4 rotate-180" />
          </Row>
          <label className="flex h-12 cursor-pointer items-center justify-between px-4 text-sm hover:bg-hover">
            {t("mutePosts")}
            <input
              type="checkbox"
              className="sr-only"
              checked={relationship.mutedPosts}
              onChange={(event) => toggle("mutedPosts", event.target.checked)}
            />
            <Switch checked={relationship.mutedPosts} />
          </label>
          <label className="flex h-12 cursor-pointer items-center justify-between px-4 text-sm hover:bg-hover">
            {t("muteStories")}
            <input
              type="checkbox"
              className="sr-only"
              checked={relationship.mutedStories}
              onChange={(event) => toggle("mutedStories", event.target.checked)}
            />
            <Switch checked={relationship.mutedStories} />
          </label>
        </div>
      ) : (
        <div className="py-1">
          <Row
            onClick={() => toggle("isCloseFriend", !relationship.isCloseFriend)}
            trailing={
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full",
                  relationship.isCloseFriend ? "bg-success text-white" : "border border-stroke"
                )}
              >
                <StarIcon filled className="size-3.5" />
              </span>
            }
          >
            {relationship.isCloseFriend ? t("removeCloseFriends") : t("addCloseFriends")}
          </Row>
          <Row
            onClick={() => toggle("isFavorite", !relationship.isFavorite)}
            trailing={<StarIcon filled={relationship.isFavorite} className="size-6" />}
          >
            {relationship.isFavorite ? t("removeFavorites") : t("addFavorites")}
          </Row>
          <Row onClick={() => setMuteOpen(true)} trailing={<ChevronRightIcon className="size-4 text-muted" />}>
            {t("mute")}
          </Row>
          <Row
            onClick={() => {
              onClose();
              onUnfollow();
            }}
          >
            {t("unfollow")}
          </Row>
        </div>
      )}
    </Modal>
  );
}
