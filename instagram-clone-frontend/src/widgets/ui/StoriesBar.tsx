"use client";

import { StoryRing } from "@/src/entities/story";
import type { StoryRing as StoryRingType } from "@/shared/domain/entities";

const mockStories: StoryRingType[] = [
  {
    user: {
      id: "1",
      username: "alex_dev",
      fullName: "Alex",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100",
      isVerified: true,
    },
    hasUnseenStories: true,
    latestStoryId: "s1",
  },
  {
    user: {
      id: "2",
      username: "elena_art",
      fullName: "Elena",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
      isVerified: false,
    },
    hasUnseenStories: true,
    latestStoryId: "s2",
  },
  {
    user: {
      id: "3",
      username: "travel_world",
      fullName: "Travel",
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100",
      isVerified: true,
    },
    hasUnseenStories: false,
    latestStoryId: "s3",
  },
];

export function StoriesBar() {
  return (
    <div className="flex items-center gap-4 py-4 px-2 overflow-x-auto no-scrollbar border-b border-zinc-200 dark:border-zinc-800">
      {mockStories.map((story) => (
        <StoryRing key={story.user.id} story={story} />
      ))}
    </div>
  );
}
