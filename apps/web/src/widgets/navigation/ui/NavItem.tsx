import type { ReactNode } from "react";
import { cn } from "@/shared/lib";

/** Row of the desktop sidebar: icon plus a label that only shows at full width */
export const navItemClass = cn(
  "group flex items-center gap-4 rounded-lg p-3 text-left text-base text-foreground",
  "transition-colors hover:bg-hover active:opacity-60",
  "focus-visible:outline-2 focus-visible:outline-primary"
);

/** Icons grow slightly on hover, as on Instagram */
export const navIconClass = "size-6 shrink-0 transition-transform group-hover:scale-105";

export function NavLabel({ collapsed, children }: { collapsed: boolean; children: ReactNode }) {
  // Collapsed = a panel is open next to the sidebar; below xl there is never room for labels
  return <span className={cn("hidden truncate", !collapsed && "xl:block")}>{children}</span>;
}
