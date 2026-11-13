"use client";

import Link from "next/link";
import {
  createContext,
  use,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from "react";
import { cn } from "@/shared/lib";

const DropdownContext = createContext<{ close: () => void } | null>(null);

export interface DropdownTriggerProps {
  ref: Ref<HTMLButtonElement>;
  onClick: () => void;
  "aria-haspopup": "menu";
  "aria-expanded": boolean;
  "aria-controls": string | undefined;
}

interface DropdownProps {
  /** Render the trigger button and spread the given props on it */
  trigger: (props: DropdownTriggerProps, state: { open: boolean }) => ReactNode;
  children: ReactNode;
  /** Which edge of the trigger the menu lines up with */
  align?: "start" | "end";
  /** Open above the trigger (e.g. the "More" menu at the bottom of the sidebar) */
  side?: "top" | "bottom";
  className?: string;
  menuClassName?: string;
}

const itemSelector = '[role="menuitem"]:not(:disabled)';

/** Menu button following the WAI-ARIA menu pattern: arrows move, Escape and outside clicks close */
export function Dropdown({ trigger, children, align = "start", side = "bottom", className, menuClassName }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>(itemSelector)?.focus();

    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePress);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePress);
  }, [open]);

  const closeAndRefocus = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      closeAndRefocus();
      return;
    }
    if (event.key === "Tab") {
      setOpen(false);
      return;
    }
    const items = [...(menuRef.current?.querySelectorAll<HTMLElement>(itemSelector) ?? [])];
    const current = items.indexOf(document.activeElement as HTMLElement);
    const next =
      event.key === "ArrowDown"
        ? (current + 1) % items.length
        : event.key === "ArrowUp"
          ? (current - 1 + items.length) % items.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? items.length - 1
              : -1;
    if (next >= 0) {
      event.preventDefault();
      items[next]?.focus();
    }
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {trigger(
        {
          ref: triggerRef,
          onClick: () => setOpen((value) => !value),
          "aria-haspopup": "menu",
          "aria-expanded": open,
          "aria-controls": open ? menuId : undefined,
        },
        { open }
      )}
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          onKeyDown={handleKeyDown}
          className={cn(
            "absolute z-50 min-w-[220px] rounded-2xl bg-elevated p-2 shadow-[0_4px_24px_rgba(0,0,0,0.2)] animate-fade-in",
            align === "start" ? "left-0" : "right-0",
            side === "bottom" ? "top-full mt-2" : "bottom-full mb-2",
            menuClassName
          )}
        >
          <DropdownContext value={{ close: closeAndRefocus }}>{children}</DropdownContext>
        </div>
      )}
    </div>
  );
}

interface DropdownItemProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onSelect"> {
  onSelect?: () => void;
  icon?: ReactNode;
  danger?: boolean;
  /** Keep the menu open after selecting (e.g. a toggle inside the menu) */
  keepOpen?: boolean;
}

export function DropdownItem({ onSelect, icon, danger = false, keepOpen = false, className, children, ...props }: DropdownItemProps) {
  const menu = use(DropdownContext);
  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      onClick={() => {
        onSelect?.();
        if (!keepOpen) menu?.close();
      }}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg p-3 text-left text-sm outline-none",
        "transition-colors hover:bg-hover focus-visible:bg-hover disabled:opacity-40",
        danger ? "text-danger" : "text-foreground",
        className
      )}
      {...props}
    >
      {icon && <span className="flex shrink-0 [&>svg]:size-[18px]">{icon}</span>}
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </button>
  );
}

interface DropdownLinkProps {
  href: string;
  icon?: ReactNode;
  children: ReactNode;
}

/** Menu row that navigates; the menu closes on click */
export function DropdownLink({ href, icon, children }: DropdownLinkProps) {
  const menu = use(DropdownContext);
  return (
    <Link
      href={href}
      role="menuitem"
      tabIndex={-1}
      onClick={() => menu?.close()}
      className="flex w-full items-center gap-3 rounded-lg p-3 text-sm text-foreground outline-none transition-colors hover:bg-hover focus-visible:bg-hover"
    >
      {icon && <span className="flex shrink-0 [&>svg]:size-[18px]">{icon}</span>}
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </Link>
  );
}

export function DropdownSeparator() {
  return <div role="separator" className="-mx-2 my-2 h-px bg-separator" />;
}
