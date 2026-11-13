"use client";

import { create } from "zustand";

export type NavigationPanel = "search" | "notifications";

interface NavigationState {
  /** Panel sliding out next to the sidebar (full-screen on phones) */
  activePanel: NavigationPanel | null;
  togglePanel: (panel: NavigationPanel) => void;
  closePanel: () => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  activePanel: null,
  togglePanel: (panel) => set((state) => ({ activePanel: state.activePanel === panel ? null : panel })),
  closePanel: () => set({ activePanel: null }),
}));
