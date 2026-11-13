"use client";

import { cn } from "@/shared/lib";
import { useToastStore } from "./toast";

/** Renders active toasts; mounted once in the app providers */
export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  return (
    <div
      // Above the mobile bottom navigation, at the bottom edge on larger screens
      className="pointer-events-none fixed inset-x-0 bottom-14 z-[100] flex flex-col items-center gap-2 px-3 md:bottom-6"
      role="region"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role={toast.type === "error" ? "alert" : "status"}
          className={cn(
            "pointer-events-auto flex w-full max-w-md items-center gap-4 rounded-lg px-4 py-3 text-sm text-white shadow-lg",
            "animate-slide-up",
            toast.type === "error" ? "bg-danger" : "bg-toast"
          )}
        >
          <span className="min-w-0 flex-1">{toast.message}</span>
          {toast.action && (
            <button
              type="button"
              onClick={() => {
                toast.action!.onClick();
                dismiss(toast.id);
              }}
              className="shrink-0 font-semibold text-white underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-white"
            >
              {toast.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
