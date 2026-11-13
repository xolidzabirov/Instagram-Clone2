"use client";

import { useState } from "react";
import { useTranslations } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { ADJUSTMENT_KEYS, FILTERS, filterCss, NO_ADJUSTMENTS, type Adjustments, type FilterId } from "../lib/filters";
import type { Slide } from "../model/types";

interface EditPanelProps {
  slide: Slide;
  onChange: (patch: Partial<Pick<Slide, "filter" | "adjust">>) => void;
}

/** Right side of the "Edit" step: Filters and Adjustments tabs */
export function EditPanel({ slide, onChange }: EditPanelProps) {
  const t = useTranslations("create");
  const [tab, setTab] = useState<"filters" | "adjustments">("filters");

  if (slide.kind === "video") {
    return <p className="p-6 text-center text-sm text-muted">{t("videoNoFilters")}</p>;
  }

  const setAdjust = (key: keyof Adjustments, value: number) => onChange({ adjust: { ...slide.adjust, [key]: value } });

  return (
    <div className="flex h-full flex-col">
      <div role="tablist" className="flex shrink-0 border-b border-separator">
        {(["filters", "adjustments"] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={cn(
              "-mb-px h-11 flex-1 border-b text-sm font-semibold",
              tab === value ? "border-foreground text-foreground" : "border-transparent text-muted"
            )}
          >
            {t(value)}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {tab === "filters" ? (
          <div className="grid grid-cols-3 gap-x-3 gap-y-4">
            {FILTERS.map((filter) => {
              const selected = slide.filter === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onChange({ filter: filter.id as FilterId })}
                  className="flex flex-col items-center gap-2"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slide.url}
                    alt=""
                    className={cn("aspect-square w-full rounded-sm object-cover", selected && "outline outline-2 outline-primary")}
                    style={{ filter: filterCss(filter.id, NO_ADJUSTMENTS) }}
                  />
                  <span className={cn("text-xs", selected ? "font-semibold text-primary" : "text-muted")}>{filter.name}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {ADJUSTMENT_KEYS.map((key) => {
              const value = slide.adjust[key];
              const min = key === "vignette" || key === "fade" ? 0 : -1;
              return (
                <label key={key} className="flex flex-col gap-3">
                  <span className="flex items-center justify-between text-base">
                    {t(key)}
                    {value !== 0 && (
                      <button type="button" onClick={() => setAdjust(key, 0)} className="text-sm font-semibold text-primary">
                        {t("reset")}
                      </button>
                    )}
                  </span>
                  <span className="flex items-center gap-4">
                    <input
                      type="range"
                      min={min}
                      max={1}
                      step={0.01}
                      value={value}
                      onChange={(event) => setAdjust(key, Number(event.target.value))}
                      className="h-0.5 flex-1 cursor-pointer accent-foreground"
                    />
                    <span className="w-8 text-right text-xs text-muted">{Math.round(value * 100)}</span>
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
