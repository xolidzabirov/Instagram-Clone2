import { cn } from "@/shared/lib";

const sizes = { sm: "size-4", md: "size-6", lg: "size-8" };

interface SpinnerProps {
  size?: keyof typeof sizes;
  className?: string;
  /** Announced to screen readers; omit when a visible label already says it */
  label?: string;
}

/** Instagram's 8-spoke activity indicator */
export function Spinner({ size = "md", className, label }: SpinnerProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn(
        "animate-spin [animation-duration:0.8s] [animation-timing-function:steps(8)]",
        sizes[size],
        className
      )}
      role={label ? "status" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {Array.from({ length: 8 }, (_, i) => (
        <rect
          key={i}
          x="11"
          y="2"
          width="2"
          height="6"
          rx="1"
          fill="currentColor"
          opacity={(i + 1) / 8}
          transform={`rotate(${i * 45} 12 12)`}
        />
      ))}
    </svg>
  );
}
