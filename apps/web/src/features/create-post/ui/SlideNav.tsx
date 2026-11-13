"use client";

import { useTranslations } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { ChevronLeftIcon, ChevronRightIcon } from "@/shared/ui";

/** Arrows and dots over the editor canvas when the post has several slides */
export function SlideNav({ index, total, onChange }: { index: number; total: number; onChange: (index: number) => void }) {
  const t = useTranslations("post");
  if (total < 2) return null;

  const arrow = "absolute top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80";
  return (
    <>
      {index > 0 && (
        <button type="button" aria-label={t("previous")} onClick={() => onChange(index - 1)} className={cn(arrow, "left-3")}>
          <ChevronLeftIcon className="size-4" />
        </button>
      )}
      {index < total - 1 && (
        <button type="button" aria-label={t("next")} onClick={() => onChange(index + 1)} className={cn(arrow, "right-3")}>
          <ChevronRightIcon className="size-4" />
        </button>
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center gap-1" aria-hidden>
        {Array.from({ length: total }, (_, position) => (
          <span key={position} className={cn("size-1.5 rounded-full", position === index ? "bg-primary" : "bg-white/60")} />
        ))}
      </div>
    </>
  );
}
