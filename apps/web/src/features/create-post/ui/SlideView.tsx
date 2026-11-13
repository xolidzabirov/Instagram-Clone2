"use client";

import { useRef, useState, type PointerEvent } from "react";
import { cn } from "@/shared/lib";
import { filterCss, vignetteCss } from "../lib/filters";
import { pan, place } from "../lib/frame";
import type { Slide } from "../model/types";

interface SlideViewProps {
  slide: Slide;
  aspect: number;
  /** Drag to move the photo inside the frame (crop step) */
  onCropChange?: (crop: Slide["crop"]) => void;
  /** Hide filters while cropping, like Instagram */
  plain?: boolean;
  className?: string;
}

/**
 * A slide as it will be published: the frame keeps the post's aspect ratio inside the
 * available square, the photo sits where the crop puts it, with filter and vignette on top.
 */
export function SlideView({ slide, aspect, onCropChange, plain = false, className }: SlideViewProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const placement = place(slide.width, slide.height, aspect, slide.crop);
  const interactive = Boolean(onCropChange) && slide.kind === "image";

  const handlePointerMove = (event: PointerEvent) => {
    if (!dragging || !onCropChange || !frameRef.current) return;
    const size = frameRef.current.clientWidth;
    onCropChange(pan(slide.crop, placement, event.movementX / size, event.movementY / size));
  };

  return (
    <div className={cn("flex size-full items-center justify-center overflow-hidden", className)}>
      <div
        ref={frameRef}
        className={cn("relative overflow-hidden bg-control", interactive && "cursor-grab touch-none", dragging && "cursor-grabbing")}
        style={aspect >= 1 ? { width: "100%", aspectRatio: aspect } : { height: "100%", aspectRatio: aspect }}
        onPointerDown={(event) => {
          if (!interactive) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragging(true);
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
      >
        {slide.kind === "video" ? (
          <video src={slide.url} muted loop autoPlay playsInline className="size-full object-cover" />
        ) : (
          // A plain <img>: object URLs of local files cannot go through the image optimizer
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={slide.url}
            alt=""
            draggable={false}
            className="absolute max-w-none select-none"
            style={{
              left: `${placement.left * 100}%`,
              top: `${(placement.top / placement.frameHeight) * 100}%`,
              width: `${placement.width * 100}%`,
              height: `${(placement.height / placement.frameHeight) * 100}%`,
              filter: plain ? undefined : filterCss(slide.filter, slide.adjust),
            }}
          />
        )}
        {!plain && slide.kind === "image" && slide.adjust.vignette > 0 && (
          <div className="pointer-events-none absolute inset-0" style={{ background: vignetteCss(slide.adjust.vignette) }} />
        )}
        {/* Rule-of-thirds grid while dragging */}
        {dragging && (
          <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3" aria-hidden>
            {Array.from({ length: 9 }, (_, index) => (
              <span key={index} className="border-[0.5px] border-white/50" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
