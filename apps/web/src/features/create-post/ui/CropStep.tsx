"use client";

import type { AspectRatio } from "@ig/shared";
import { MAX_POST_MEDIA } from "@ig/shared";
import { useId, useState, type ReactNode } from "react";
import { useTranslations } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { CloseIcon, CreateIcon, CropIcon, MediaIcon, ZoomIcon } from "@/shared/ui";
import { ASPECT_OPTIONS, type Slide } from "../model/types";
import { ACCEPT } from "./SelectStep";
import { SlideNav } from "./SlideNav";
import { SlideView } from "./SlideView";

interface CropStepProps {
  slides: Slide[];
  index: number;
  onIndexChange: (index: number) => void;
  aspect: number;
  aspectRatio: AspectRatio;
  /** Reels are always 9:16: the ratio menu is hidden */
  isReel: boolean;
  onAspectChange: (ratio: AspectRatio) => void;
  onCropChange: (crop: Slide["crop"]) => void;
  onAddFiles: (files: File[]) => void;
  onRemove: (id: string) => void;
  onMove: (from: number, to: number) => void;
}

type Panel = "aspect" | "zoom" | "gallery" | null;

function ToolButton({ label, active, onClick, children }: { label: string; active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-expanded={active}
      onClick={onClick}
      className={cn(
        "flex size-8 items-center justify-center rounded-full transition-colors [&>svg]:size-4",
        active ? "bg-white text-black" : "bg-black/60 text-white hover:bg-black/40"
      )}
    >
      {children}
    </button>
  );
}

/** Crop: drag to frame the photo, pick the ratio and zoom, reorder or add slides */
export function CropStep(props: CropStepProps) {
  const { slides, index, aspect, aspectRatio, isReel } = props;
  const t = useTranslations("create");
  const [panel, setPanel] = useState<Panel>(null);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const inputId = useId();
  const slide = slides[index]!;
  const toggle = (next: Panel) => setPanel((current) => (current === next ? null : next));

  return (
    <div className="relative size-full bg-control">
      <SlideView slide={slide} aspect={aspect} plain onCropChange={props.onCropChange} />
      <SlideNav index={index} total={slides.length} onChange={props.onIndexChange} />

      <div className="absolute bottom-4 left-4 flex items-end gap-3">
        {!isReel && (
          <div className="relative">
            {panel === "aspect" && (
              <div role="menu" className="absolute bottom-10 left-0 w-32 overflow-hidden rounded-lg bg-black/75 text-sm text-white/60">
                {ASPECT_OPTIONS.map((option) => (
                  <button
                    key={option.ratio}
                    type="button"
                    role="menuitemradio"
                    aria-checked={option.ratio === aspectRatio}
                    onClick={() => props.onAspectChange(option.ratio)}
                    className={cn(
                      "flex h-12 w-full items-center justify-between border-b border-white/20 px-4 font-semibold last:border-0",
                      option.ratio === aspectRatio && "text-white"
                    )}
                  >
                    {option.label}
                    <span
                      aria-hidden
                      className="border-2 border-current"
                      style={{ width: option.value >= 1 ? 22 : 22 * option.value, height: option.value >= 1 ? 22 / option.value : 22 }}
                    />
                  </button>
                ))}
              </div>
            )}
            <ToolButton label={t("aspect")} active={panel === "aspect"} onClick={() => toggle("aspect")}>
              <CropIcon />
            </ToolButton>
          </div>
        )}

        {slide.kind === "image" && (
          <div className="relative">
            {panel === "zoom" && (
              <div className="absolute bottom-10 left-0 flex h-8 w-[132px] items-center rounded-lg bg-black/75 px-3">
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={slide.crop.zoom}
                  aria-label={t("zoom")}
                  onChange={(event) => props.onCropChange({ ...slide.crop, zoom: Number(event.target.value) })}
                  className="h-0.5 w-full cursor-pointer accent-white"
                />
              </div>
            )}
            <ToolButton label={t("zoom")} active={panel === "zoom"} onClick={() => toggle("zoom")}>
              <ZoomIcon />
            </ToolButton>
          </div>
        )}
      </div>

      <div className="absolute bottom-4 right-4">
        {panel === "gallery" && (
          <div className="absolute bottom-10 right-0 flex max-w-[min(90vw,560px)] items-center gap-3 overflow-x-auto rounded-lg bg-black/75 p-3">
            {slides.map((item, position) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => setDragFrom(position)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (dragFrom !== null && dragFrom !== position) props.onMove(dragFrom, position);
                  setDragFrom(null);
                }}
                className={cn("relative size-[94px] shrink-0 cursor-grab", position !== index && "opacity-50")}
              >
                <button type="button" onClick={() => props.onIndexChange(position)} className="size-full" aria-label={`${position + 1}`}>
                  {item.kind === "video" ? (
                    <video src={item.url} muted className="size-full object-cover" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.url} alt="" draggable={false} className="size-full object-cover" />
                  )}
                </button>
                {position === index && (
                  <button
                    type="button"
                    aria-label={t("removeSlide")}
                    onClick={() => props.onRemove(item.id)}
                    className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/70 text-white"
                  >
                    <CloseIcon className="size-3" />
                  </button>
                )}
              </div>
            ))}
            {slides.length < MAX_POST_MEDIA && !isReel && (
              <button
                type="button"
                aria-label={t("addMore")}
                onClick={() => document.getElementById(inputId)?.click()}
                className="flex size-12 shrink-0 items-center justify-center rounded-full border border-white/40 text-white/80 hover:text-white"
              >
                <CreateIcon className="size-6" />
              </button>
            )}
            <input
              id={inputId}
              type="file"
              multiple
              accept={ACCEPT}
              className="hidden"
              onChange={(event) => {
                props.onAddFiles([...(event.target.files ?? [])]);
                event.target.value = "";
              }}
            />
          </div>
        )}
        <ToolButton label={t("gallery")} active={panel === "gallery"} onClick={() => toggle("gallery")}>
          <MediaIcon />
        </ToolButton>
      </div>
    </div>
  );
}
