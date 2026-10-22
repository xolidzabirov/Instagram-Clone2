"use client";

import { StoryRing } from "@/src/entities/story";
import { useStoryStore } from "@/src/features/story";

export function StoriesBar() {
  const { getStoryRings, openStoryByUser } = useStoryStore();
  const storyRings = getStoryRings();

  return (
    <div className="flex items-center gap-4 py-4 px-2 overflow-x-auto no-scrollbar border-b border-zinc-200 dark:border-zinc-800">
      {storyRings.map((story) => (
        <StoryRing
          key={story.user.id}
          story={story}
          onClick={() => openStoryByUser(story.user.id)}
        />
      ))}
    </div>
  );
}

