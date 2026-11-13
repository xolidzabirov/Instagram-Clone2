"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/shared/lib";

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  /** undefined while the value is not known yet (e.g. before the theme is read in the browser) */
  value: T | undefined;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}

/** One-of-many choice shown as joined buttons; native radios give keyboard support for free */
export function SegmentedControl<T extends string>({ options, value, onChange, ariaLabel, className }: SegmentedControlProps<T>) {
  const name = useId();
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn("inline-flex rounded-lg bg-control p-0.5", className)}>
      {options.map((option) => (
        <label
          key={option.value}
          className={cn(
            "flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary",
            option.value === value ? "bg-background text-foreground shadow-sm" : "text-muted hover:text-foreground"
          )}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={option.value === value}
            onChange={() => onChange(option.value)}
            className="sr-only"
          />
          {option.icon && <span className="flex [&>svg]:size-4">{option.icon}</span>}
          {option.label}
        </label>
      ))}
    </div>
  );
}
