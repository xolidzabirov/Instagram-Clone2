import { useId } from "react";
import { cn } from "@/shared/lib";

/** Script wordmark. The font is provided by app/layout.tsx through the --font-logo-script variable. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("font-logo text-[28px] leading-none text-foreground select-none", className)}>Instagram</span>
  );
}

/** Compact mark for narrow navigation: a camera glyph in Instagram's gradient */
export function LogoMark({ className }: { className?: string }) {
  // Several marks can be on a page; gradient ids must not collide
  const gradientId = useId();
  const stroke = `url(#${gradientId})`;
  return (
    <svg viewBox="0 0 24 24" className={cn("size-6", className)} role="img" aria-label="Instagram">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#fd5" />
          <stop offset="0.5" stopColor="#ff543e" />
          <stop offset="1" stopColor="#c837ab" />
        </linearGradient>
      </defs>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" fill="none" stroke={stroke} strokeWidth="2" />
      <circle cx="12" cy="12" r="4.3" fill="none" stroke={stroke} strokeWidth="2" />
      <circle cx="17.4" cy="6.6" r="1.2" fill={stroke} />
    </svg>
  );
}
