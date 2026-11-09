"use client";

import type { StoryRing as StoryRingType } from "@ig/shared";
import { Avatar } from "@/shared/ui";

interface StoryRingProps {
  story: StoryRingType;
  onClick?: (userId: string) => void;
}

export function StoryRing({ story, onClick }: StoryRingProps) {
  return (
    <button
      className="flex flex-col items-center gap-1 w-[66px]"
      onClick={() => onClick?.(story.user.id)}
    >
      <Avatar
        src={story.user.avatar}
        alt={story.user.username}
        size="lg"
        hasStory
        hasUnseenStory={story.hasUnseenStories}
      />
      <span className="text-xs text-zinc-900 dark:text-zinc-100 truncate w-full text-center">
        {story.user.username}
      </span>
    </button>
  );
}
