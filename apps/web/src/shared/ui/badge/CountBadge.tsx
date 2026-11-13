import { cn } from "@/shared/lib";

/** Red unread counter on navigation icons; hidden at zero, capped at 9+ like Instagram */
export function CountBadge({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        "absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-badge text-white",
        "text-[11px] font-semibold leading-[18px] text-center ring-2 ring-background",
        className
      )}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}
