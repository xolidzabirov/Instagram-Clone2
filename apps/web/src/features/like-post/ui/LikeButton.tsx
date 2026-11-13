"use client";

import { useState } from "react";
import { useTranslations } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { HeartIcon } from "@/shared/ui";

interface LikeButtonProps {
  isLiked: boolean;
  onToggle: () => void;
}

/** Instagram's heart: outline → red with a little pop */
export function LikeButton({ isLiked, onToggle }: LikeButtonProps) {
  const t = useTranslations("post");
  const [pop, setPop] = useState(false);

  return (
    <button
      type="button"
      aria-label={isLiked ? t("unlike") : t("like")}
      aria-pressed={isLiked}
      onClick={() => {
        if (!isLiked) setPop(true);
        onToggle();
      }}
      onAnimationEnd={() => setPop(false)}
      className={cn("p-2 transition-opacity", !isLiked && "hover:opacity-60", pop && "animate-like-pop")}
    >
      <HeartIcon filled={isLiked} className={cn("size-6", isLiked && "text-danger")} />
    </button>
  );
}
