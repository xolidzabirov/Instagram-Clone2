import { cn } from "@/shared/lib";
import { VerifiedIcon } from "../icons";

export function VerifiedBadge({ className, label }: { className?: string; label: string }) {
  return (
    <span role="img" aria-label={label} title={label} className={cn("inline-flex shrink-0 text-primary", className)}>
      <VerifiedIcon className="size-[1em]" />
    </span>
  );
}
