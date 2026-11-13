"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { cn } from "@/shared/lib";

export interface TabItem<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

interface TabsProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Accessible name of the tab list */
  ariaLabel: string;
  /**
   * "profile": centered, indicator on the top edge, labels hidden on phones (icons only).
   * "underline": equal-width tabs with a bottom indicator (feeds, lists).
   */
  variant?: "profile" | "underline";
  /** Prefix for tab / panel ids: pair a panel with `tabPanelProps(idBase, value)` */
  idBase: string;
  className?: string;
}

/** Props for the element that shows the active tab's content */
export function tabPanelProps(idBase: string, value: string) {
  return { role: "tabpanel", id: `${idBase}-panel-${value}`, "aria-labelledby": `${idBase}-tab-${value}` } as const;
}

export function Tabs<T extends string>({ items, value, onChange, ariaLabel, variant = "underline", idBase, className }: TabsProps<T>) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = items.findIndex((item) => item.value === value);
    const next =
      event.key === "ArrowRight"
        ? (index + 1) % items.length
        : event.key === "ArrowLeft"
          ? (index - 1 + items.length) % items.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? items.length - 1
              : -1;
    if (next < 0) return;
    event.preventDefault();
    const item = items[next]!;
    onChange(item.value);
    document.getElementById(`${idBase}-tab-${item.value}`)?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      className={cn(
        "flex border-separator",
        variant === "profile" ? "justify-center gap-0 border-t md:gap-14" : "border-b",
        className
      )}
    >
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            id={`${idBase}-tab-${item.value}`}
            aria-selected={selected}
            aria-controls={`${idBase}-panel-${item.value}`}
            // Only the active tab is in the tab order; arrows move between tabs
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.value)}
            className={cn(
              "flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wide",
              "transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary",
              variant === "profile"
                ? "-mt-px h-[52px] flex-1 border-t md:flex-none"
                : "-mb-px h-11 flex-1 border-b normal-case text-sm tracking-normal",
              selected ? "border-foreground text-foreground" : "border-transparent text-muted hover:text-foreground"
            )}
          >
            {item.icon && <span className="flex [&>svg]:size-6 md:[&>svg]:size-3">{item.icon}</span>}
            <span className={cn(variant === "profile" && Boolean(item.icon) && "sr-only md:not-sr-only")}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
