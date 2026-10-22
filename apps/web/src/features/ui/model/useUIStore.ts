"use client";

import { create } from "zustand";

interface UIState {
  isCreateModalOpen: boolean;
  isSearchOpen: boolean;
  isNotificationsOpen: boolean;
  isMoreMenuOpen: boolean;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  toggleSearch: () => void;
  closeSearch: () => void;
  toggleNotifications: () => void;
  closeNotifications: () => void;
  toggleMoreMenu: () => void;
  closeMoreMenu: () => void;
  closeAllPanels: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isCreateModalOpen: false,
  isSearchOpen: false,
  isNotificationsOpen: false,
  isMoreMenuOpen: false,

  openCreateModal: () => set({ isCreateModalOpen: true, isSearchOpen: false, isNotificationsOpen: false }),
  closeCreateModal: () => set({ isCreateModalOpen: false }),

  toggleSearch: () =>
    set((state) => ({
      isSearchOpen: !state.isSearchOpen,
      isNotificationsOpen: false,
      isMoreMenuOpen: false,
    })),
  closeSearch: () => set({ isSearchOpen: false }),

  toggleNotifications: () =>
    set((state) => ({
      isNotificationsOpen: !state.isNotificationsOpen,
      isSearchOpen: false,
      isMoreMenuOpen: false,
    })),
  closeNotifications: () => set({ isNotificationsOpen: false }),

  toggleMoreMenu: () => set((state) => ({ isMoreMenuOpen: !state.isMoreMenuOpen })),
  closeMoreMenu: () => set({ isMoreMenuOpen: false }),

  closeAllPanels: () =>
    set({
      isCreateModalOpen: false,
      isSearchOpen: false,
      isNotificationsOpen: false,
      isMoreMenuOpen: false,
    }),
}));
