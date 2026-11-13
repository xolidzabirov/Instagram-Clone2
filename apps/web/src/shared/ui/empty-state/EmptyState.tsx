import type { ReactNode } from "react";
import { cn } from "@/shared/lib";

interface EmptyStateProps {
  /** Shown inside Instagram's outlined circle */
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 px-6 py-16 text-center", className)}>
      {icon && (
        <div className="flex size-[62px] items-center justify-center rounded-full border-2 border-foreground [&>svg]:size-8">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-bold text-foreground">{title}</h3>
      {description && <p className="max-w-sm text-sm text-muted">{description}</p>}
      {action}
    </div>
  );
}
