import type { ButtonHTMLAttributes, Ref } from "react";
import { cn } from "@/shared/lib";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Icon-only buttons have no text, so a label for screen readers is required */
  "aria-label": string;
  ref?: Ref<HTMLButtonElement>;
}

export function IconButton({ className, type = "button", ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-full p-2 text-foreground",
        "transition-[opacity,transform] hover:opacity-60 active:scale-90 disabled:opacity-30 disabled:pointer-events-none",
        "focus-visible:outline-2 focus-visible:outline-primary",
        className
      )}
      {...props}
    />
  );
}
