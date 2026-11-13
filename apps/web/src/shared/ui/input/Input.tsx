"use client";

import { useId, useState, type InputHTMLAttributes, type ReactNode, type Ref } from "react";
import { cn } from "@/shared/lib";
import { EyeIcon, EyeOffIcon } from "../icons";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "placeholder"> {
  /** Floats above the value once the field is filled, like Instagram's auth forms */
  label: string;
  error?: string;
  hint?: string;
  /** Rendered inside the field on the right (e.g. a "Show" button or a status icon) */
  rightSlot?: ReactNode;
  ref?: Ref<HTMLInputElement>;
}

export function Input({ label, error, hint, rightSlot, className, id, ...props }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const messageId = `${inputId}-message`;
  const message = error ?? hint;

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "relative flex items-center rounded-[3px] border bg-surface",
          "focus-within:border-stroke",
          error ? "border-danger" : "border-separator"
        )}
      >
        <input
          id={inputId}
          // A blank placeholder lets CSS tell "empty" from "filled" for the floating label
          placeholder=" "
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          className={cn(
            "peer h-[38px] w-full min-w-0 bg-transparent px-2 text-xs text-foreground outline-none",
            "[&:not(:placeholder-shown)]:pt-[14px] disabled:opacity-50"
          )}
          {...props}
        />
        <label
          htmlFor={inputId}
          className={cn(
            "pointer-events-none absolute left-2 right-2 top-1/2 -translate-y-1/2 truncate text-xs text-muted",
            "origin-left transition-transform duration-100",
            "peer-[:not(:placeholder-shown)]:-translate-y-[17px] peer-[:not(:placeholder-shown)]:scale-[0.83]"
          )}
        >
          {label}
        </label>
        {rightSlot && <div className="flex shrink-0 items-center pr-2">{rightSlot}</div>}
      </div>
      {message && (
        <p id={messageId} className={cn("mt-1 px-0.5 text-xs", error ? "text-danger" : "text-muted")}>
          {message}
        </p>
      )}
    </div>
  );
}

interface PasswordInputProps extends Omit<InputProps, "type" | "rightSlot"> {
  showLabel: string;
  hideLabel: string;
}

/** Password field with a show / hide toggle */
export function PasswordInput({ showLabel, hideLabel, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const toggleLabel = visible ? hideLabel : showLabel;

  return (
    <Input
      type={visible ? "text" : "password"}
      rightSlot={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={toggleLabel}
          title={toggleLabel}
          className="rounded p-1 text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
        >
          {visible ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
        </button>
      }
      {...props}
    />
  );
}
