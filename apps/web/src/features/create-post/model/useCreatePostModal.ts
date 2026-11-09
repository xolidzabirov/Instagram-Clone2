"use client";

import { create } from "zustand";

interface CreatePostModalState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useCreatePostModal = create<CreatePostModalState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
