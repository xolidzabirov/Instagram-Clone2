"use client";

import { useEffect, useId, useRef, type ButtonHTMLAttributes, type MouseEvent, type ReactNode } from "react";
import { cn } from "@/shared/lib";
import { IconButton } from "../button/IconButton";
import { CloseIcon } from "../icons";

const sizes = {
  /** Confirmations and action lists */
  sm: "w-full max-w-[400px]",
  md: "w-full max-w-[548px]",
  lg: "w-full max-w-[860px]",
  /** The content decides (e.g. the post viewer) */
  auto: "",
};

interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** Rendered in the header and used as the accessible name */
  title?: string;
  /** Accessible name when there is no visible title */
  ariaLabel?: string;
  /** "sheet" slides up from the bottom edge: the mobile pattern for menus and comments */
  variant?: "center" | "sheet";
  size?: keyof typeof sizes;
  /** Label of the close button; the button is shown only when provided */
  closeLabel?: string;
  /** Set to false for flows that must not be dismissed by a stray click (e.g. an unsaved post) */
  closeOnBackdrop?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Built on the native <dialog>: the browser provides the focus trap, Escape handling,
 * the top layer and an inert page behind, so none of that is re-implemented here.
 */
export function Modal(props: ModalProps) {
  // Unmounted while closed: content state resets on every open and nothing stays in the DOM
  return props.open ? <ModalDialog {...props} /> : null;
}

function ModalDialog({
  onClose,
  title,
  ariaLabel,
  variant = "center",
  size = "md",
  closeLabel,
  closeOnBackdrop = true,
  className,
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current!;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;

    dialog.showModal();
    root.style.overflow = "hidden";

    return () => {
      root.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    // The dialog element itself is only the padding around the panel
    if (closeOnBackdrop && event.target === event.currentTarget) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={title ? titleId : undefined}
      aria-label={title ? undefined : ariaLabel}
      onCancel={(event) => {
        // Stay controlled: the parent decides whether Escape closes
        event.preventDefault();
        onClose();
      }}
      onClick={handleBackdropClick}
      className={cn(
        "fixed inset-0 m-0 size-full max-h-none max-w-none bg-transparent text-foreground",
        "backdrop:bg-black/65 open:flex justify-center animate-fade-in",
        variant === "center" ? "items-center p-4" : "items-end"
      )}
    >
      <div
        className={cn(
          "flex max-h-full flex-col overflow-hidden bg-elevated shadow-2xl",
          variant === "center" ? "rounded-xl animate-scale-in" : "max-h-[85dvh] w-full rounded-t-xl animate-slide-up",
          variant === "center" && sizes[size],
          className
        )}
      >
        {variant === "sheet" && <div aria-hidden className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-stroke" />}
        {(title || closeLabel) && (
          <header className="relative flex h-[43px] shrink-0 items-center justify-center border-b border-separator px-12">
            {title && (
              <h2 id={titleId} className="truncate text-base font-semibold">
                {title}
              </h2>
            )}
            {closeLabel && (
              <IconButton aria-label={closeLabel} onClick={onClose} className="absolute right-1.5">
                <CloseIcon className="size-5" />
              </IconButton>
            )}
          </header>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </dialog>
  );
}

interface ModalActionProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: "default" | "primary" | "danger";
}

/** Full-width row of an Instagram action dialog ("Unfollow", "Cancel"…) */
export function ModalAction({ tone = "default", className, type = "button", ...props }: ModalActionProps) {
  return (
    <button
      type={type}
      className={cn(
        "block h-12 w-full border-t border-separator px-4 text-sm first:border-t-0",
        "transition-colors hover:bg-hover active:bg-control disabled:opacity-40",
        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary",
        tone === "danger" && "font-bold text-danger",
        tone === "primary" && "font-bold text-primary",
        className
      )}
      {...props}
    />
  );
}
