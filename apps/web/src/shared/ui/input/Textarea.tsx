"use client";

import { useId, type Ref, type TextareaHTMLAttributes } from "react";
import { cn } from "@/shared/lib";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Accessible name; visually hidden because Instagram's text areas rely on the placeholder */
  label: string;
  error?: string;
  /** Shows "12/2200" under the field when maxLength is set */
  showCount?: boolean;
  ref?: Ref<HTMLTextAreaElement>;
}

export function Textarea({ label, error, showCount = false, className, id, maxLength, value, rows = 3, ...props }: TextareaProps) {
  const autoId = useId();
  const textareaId = id ?? autoId;
  const errorId = `${textareaId}-error`;
  const length = typeof value === "string" ? value.length : 0;

  return (
    <div className={cn("w-full", className)}>
      <label htmlFor={textareaId} className="sr-only">
        {label}
      </label>
      <textarea
        id={textareaId}
        rows={rows}
        value={value}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        // field-sizing grows the box with its content where supported; elsewhere `rows` applies
        className="block w-full resize-none bg-transparent text-sm text-foreground outline-none [field-sizing:content] placeholder:text-muted disabled:opacity-50"
        {...props}
      />
      {(error || (showCount && maxLength)) && (
        <div className="mt-1 flex justify-between gap-3 text-xs">
          <span id={errorId} className="text-danger">
            {error}
          </span>
          {showCount && maxLength && (
            <span className={cn("ml-auto tabular-nums", length >= maxLength ? "text-danger" : "text-muted")}>
              {length.toLocaleString()}/{maxLength.toLocaleString()}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
