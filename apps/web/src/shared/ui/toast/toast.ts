import { create } from "zustand";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: number;
  message: string;
  type: "info" | "error";
  action?: ToastAction;
}

interface ToastState {
  toasts: ToastItem[];
  dismiss: (id: number) => void;
}

/** At most this many toasts are visible; older ones are dropped */
const MAX_VISIBLE = 3;
const DEFAULT_DURATION_MS = 4000;

let nextId = 1;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));

interface ToastOptions {
  type?: ToastItem["type"];
  action?: ToastAction;
  durationMs?: number;
}

/**
 * Shows a short message at the bottom of the screen, callable from anywhere (including
 * outside React, e.g. the API client): `toast("Ссылка скопирована")`, `toast.error(...)`.
 */
export function toast(message: string, { type = "info", action, durationMs = DEFAULT_DURATION_MS }: ToastOptions = {}) {
  const id = nextId++;
  useToastStore.setState((state) => ({
    toasts: [...state.toasts, { id, message, type, action }].slice(-MAX_VISIBLE),
  }));
  setTimeout(() => useToastStore.getState().dismiss(id), durationMs);
  return id;
}

toast.error = (message: string, options: Omit<ToastOptions, "type"> = {}) => toast(message, { ...options, type: "error" });
