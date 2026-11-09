"use client";

import { create } from "zustand";
import type { Story, StoryRing } from "@ig/shared";
import { mockStories } from "./mocks";

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
  stories: mockStories,
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
