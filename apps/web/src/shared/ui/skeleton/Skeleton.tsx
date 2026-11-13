import { cn } from "@/shared/lib";

/** Loading placeholder: size and shape come from className, e.g. "h-4 w-32" or "size-11 rounded-full" */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded bg-control", className)} />;
}
