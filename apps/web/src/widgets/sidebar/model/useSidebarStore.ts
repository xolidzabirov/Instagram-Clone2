"use client";

import { create } from "zustand";

export type SidebarPanel = "search" | "notifications";

interface SidebarState {
  activePanel: SidebarPanel | null;
  isMoreMenuOpen: boolean;
  togglePanel: (panel: SidebarPanel) => void;
  closePanel: () => void;
  toggleMoreMenu: () => void;
  closeMoreMenu: () => void;
  closeAll: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  activePanel: null,
  isMoreMenuOpen: false,

  togglePanel: (panel) =>
    set((state) => ({
      activePanel: state.activePanel === panel ? null : panel,
      isMoreMenuOpen: false,
    })),
  closePanel: () => set({ activePanel: null }),

  toggleMoreMenu: () => set((state) => ({ isMoreMenuOpen: !state.isMoreMenuOpen })),
  closeMoreMenu: () => set({ isMoreMenuOpen: false }),

  closeAll: () => set({ activePanel: null, isMoreMenuOpen: false }),
}));
