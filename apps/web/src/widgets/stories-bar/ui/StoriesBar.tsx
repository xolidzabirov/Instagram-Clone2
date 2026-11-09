"use client";

import { useMemo } from "react";
import { StoryRing, useStoryStore } from "@/entities/story";

export function StoriesBar() {
  // Subscribe to the data itself so rings turn grey as soon as a story is seen
  const stories = useStoryStore((s) => s.stories);
  const seenStoryIds = useStoryStore((s) => s.seenStoryIds);
  const openStoryByUser = useStoryStore((s) => s.openStoryByUser);

  const storyRings = useMemo(
    () =>
      stories.map((story) => ({
        user: story.author,
        hasUnseenStories: !seenStoryIds.has(story.id),
        latestStoryId: story.id,
      })),
    [stories, seenStoryIds]
  );

  return (
    <div className="flex items-center gap-4 py-4 px-2 overflow-x-auto no-scrollbar border-b border-zinc-200 dark:border-zinc-800">
      {storyRings.map((story) => (
        <StoryRing key={story.user.id} story={story} onClick={() => openStoryByUser(story.user.id)} />
      ))}
    </div>
  );
}
