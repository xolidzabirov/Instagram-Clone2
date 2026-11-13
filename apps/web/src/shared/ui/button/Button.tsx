import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { cn } from "@/shared/lib";
import { Spinner } from "../spinner/Spinner";

const variants = {
  primary: "bg-primary text-white hover:bg-primary-hover",
  secondary: "bg-control text-foreground hover:bg-control-hover",
  danger: "bg-danger text-white hover:opacity-90",
  ghost: "text-foreground hover:bg-hover",
  /** Text-only action, e.g. "Follow" in lists or "Share" in a modal header */
  link: "text-primary hover:text-link !px-0 !h-auto",
};

const sizes = {
  sm: "h-8 px-4 text-sm",
  md: "h-9 px-4 text-sm",
  lg: "h-11 px-6 text-sm",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  /** Shows a spinner in place of the label and blocks clicks; the width does not jump */
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  ref?: Ref<HTMLButtonElement>;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  leftIcon,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap select-none",
        "transition-colors active:opacity-70 disabled:opacity-40 disabled:pointer-events-none",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      <span className={cn("inline-flex items-center gap-2", loading && "invisible")}>
        {leftIcon}
        {children}
      </span>
      {loading && <Spinner size="sm" className="absolute" />}
    </button>
  );
}
