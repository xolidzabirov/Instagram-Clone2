"use client";

import { create } from "zustand";
import type { Story, StoryRing } from "@ig/shared";

const INITIAL_STORIES: Story[] = [
  {
    id: "story_1",
    author: {
      id: "u1",
      username: "alex_dev",
      fullName: "Alex",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120",
      isVerified: true,
    },
    items: [
      {
        id: "si_1",
        type: "image",
        url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1080",
        duration: 5,
      },
      {
        id: "si_2",
        type: "image",
        url: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1080",
        duration: 5,
      },
    ],
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 18).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: "story_2",
    author: {
      id: "u2",
      username: "travel_world",
      fullName: "Travel World",
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120",
      isVerified: true,
    },
    items: [
      {
        id: "si_3",
        type: "image",
        url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1080",
        duration: 5,
      },
    ],
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: "story_3",
    author: {
      id: "u3",
      username: "sarah_design",
      fullName: "Sarah Designer",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120",
      isVerified: false,
    },
    items: [
      {
        id: "si_4",
        type: "image",
        url: "https://images.unsplash.com/photo-1542744094-3a31f272c490?w=1080",
        duration: 5,
      },
    ],
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 20).toISOString(),
    createdAt: new Date().toISOString(),
  },
];

interface StoryState {
  stories: Story[];
  seenStoryIds: Set<string>;
  isOpen: boolean;
  activeStoryIndex: number;
  activeItemIndex: number;

  openStoryByUser: (userId: string) => void;
  closeStory: () => void;
  nextItem: () => void;
  prevItem: () => void;
  getStoryRings: () => StoryRing[];
}

export const useStoryStore = create<StoryState>((set, get) => ({
  stories: INITIAL_STORIES,
  seenStoryIds: new Set<string>(),
  isOpen: false,
  activeStoryIndex: 0,
  activeItemIndex: 0,

  openStoryByUser: (userId) => {
    const stories = get().stories;
    const index = stories.findIndex((s) => s.author.id === userId);
    if (index !== -1) {
      const currentStory = stories[index];
      set((state) => ({
        isOpen: true,
        activeStoryIndex: index,
        activeItemIndex: 0,
        seenStoryIds: new Set(state.seenStoryIds).add(currentStory.id),
      }));
    }
  },

  closeStory: () => set({ isOpen: false, activeItemIndex: 0 }),

  nextItem: () => {
    const { stories, activeStoryIndex, activeItemIndex, seenStoryIds } = get();
    const currentStory = stories[activeStoryIndex];

    if (!currentStory) return;

    if (activeItemIndex < currentStory.items.length - 1) {
      // Next slide in current story
      set({ activeItemIndex: activeItemIndex + 1 });
    } else if (activeStoryIndex < stories.length - 1) {
      // Next user's story
      const nextStory = stories[activeStoryIndex + 1];
      set({
        activeStoryIndex: activeStoryIndex + 1,
        activeItemIndex: 0,
        seenStoryIds: new Set(seenStoryIds).add(nextStory.id),
      });
    } else {
      // Ended all stories
      set({ isOpen: false, activeItemIndex: 0 });
    }
  },

  prevItem: () => {
    const { stories, activeStoryIndex, activeItemIndex } = get();

    if (activeItemIndex > 0) {
      set({ activeItemIndex: activeItemIndex - 1 });
    } else if (activeStoryIndex > 0) {
      const prevStory = stories[activeStoryIndex - 1];
      set({
        activeStoryIndex: activeStoryIndex - 1,
        activeItemIndex: prevStory.items.length - 1,
      });
    }
  },

  getStoryRings: () => {
    const { stories, seenStoryIds } = get();
    return stories.map((s) => ({
      user: s.author,
      hasUnseenStories: !seenStoryIds.has(s.id),
      latestStoryId: s.id,
    }));
  },
}));
