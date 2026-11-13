"use client";

import type { AspectRatio, PostMediaItem } from "@ig/shared";
import Image from "next/image";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useTranslations } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { ChevronLeftIcon, ChevronRightIcon, useHeartBurst } from "@/shared/ui";
import { feedAspect, mediaImageUrl } from "../lib/aspect";

interface PostMediaProps {
  media: PostMediaItem[];
  aspectRatio: AspectRatio;
  /** Double click / double tap: like (the heart animation plays either way) */
  onDoubleTap?: () => void;
  /** Load the first image eagerly (above the fold) */
  priority?: boolean;
  className?: string;
}

function VideoSlide({ item }: { item: PostMediaItem }) {
  const t = useTranslations("post");
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  // Autoplay muted while at least 60% of the video is on screen, like the feed in the app
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => (entry?.isIntersecting ? void video.play().catch(() => {}) : video.pause()),
      { threshold: 0.6 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <video
        ref={ref}
        src={item.urls["mp4"]}
        poster={item.urls["poster"]}
        muted={muted}
        loop
        playsInline
        preload="metadata"
        aria-label={item.altText ?? undefined}
        className="size-full object-cover"
        onClick={(event) => {
          const video = event.currentTarget;
          if (video.paused) void video.play();
          else video.pause();
        }}
      />
      <button
        type="button"
        onClick={() => setMuted((value) => !value)}
        aria-label={muted ? t("unmute") : t("mute")}
        className="absolute bottom-3 right-3 flex size-7 items-center justify-center rounded-full bg-black/60 text-white"
      >
        {muted ? (
          <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor" aria-hidden>
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.6 3 2.7-2.7-1.4-1.4-2.7 2.7-2.7-2.7-1.4 1.4 2.7 2.7-2.7 2.7 1.4 1.4 2.7-2.7 2.7 2.7 1.4-1.4z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor" aria-hidden>
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z" />
          </svg>
        )}
      </button>
    </>
  );
}

/** Instagram's media block: swipeable carousel with arrows and dots, double-tap heart, muted autoplay video */
export function PostMedia({ media, aspectRatio, onDoubleTap, priority = false, className }: PostMediaProps) {
  const t = useTranslations("post");
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const { trigger, burst } = useHeartBurst();
  const total = media.length;

  const goTo = (next: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
  };

  const handleDoubleClick = (event: MouseEvent) => {
    // Double clicks on the arrows or the mute button are just fast clicks
    if ((event.target as HTMLElement).closest("button")) return;
    trigger();
    onDoubleTap?.();
  };

  return (
    <div className={cn("relative overflow-hidden bg-control", className)} onDoubleClick={handleDoubleClick}>
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ aspectRatio: feedAspect(aspectRatio) }}
        onScroll={(event) => {
          const track = event.currentTarget;
          setIndex(Math.round(track.scrollLeft / Math.max(1, track.clientWidth)));
        }}
        aria-roledescription={total > 1 ? "carousel" : undefined}
      >
        {media.map((item, position) => (
          <div
            key={item.id}
            className="relative size-full shrink-0 snap-center snap-always"
            aria-roledescription={total > 1 ? "slide" : undefined}
            aria-label={total > 1 ? t("slide", { index: position + 1, total }) : undefined}
          >
            {item.type === "VIDEO" ? (
              <VideoSlide item={item} />
            ) : (
              mediaImageUrl(item) && (
                <Image
                  src={mediaImageUrl(item)!}
                  alt={item.altText ?? ""}
                  fill
                  sizes="(max-width: 470px) 100vw, 470px"
                  loading={priority && position === 0 ? "eager" : "lazy"}
                  fetchPriority={priority && position === 0 ? "high" : undefined}
                  draggable={false}
                  onError={(event) => {
                    event.currentTarget.style.visibility = "hidden";
                  }}
                  className="select-none object-cover"
                />
              )
            )}
          </div>
        ))}
      </div>

      {total > 1 && index > 0 && (
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          aria-label={t("previous")}
          className="absolute left-2 top-1/2 flex size-[26px] -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-black shadow transition-opacity hover:bg-white max-md:hidden"
        >
          <ChevronLeftIcon className="size-4" />
        </button>
      )}
      {total > 1 && index < total - 1 && (
        <button
          type="button"
          onClick={() => goTo(index + 1)}
          aria-label={t("next")}
          className="absolute right-2 top-1/2 flex size-[26px] -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-black shadow transition-opacity hover:bg-white max-md:hidden"
        >
          <ChevronRightIcon className="size-4" />
        </button>
      )}

      {total > 1 && (
        <>
          <span className="absolute right-3 top-3 rounded-full bg-black/70 px-2 py-0.5 text-xs font-semibold text-white md:hidden">
            {index + 1}/{total}
          </span>
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1" aria-hidden>
            {media.map((item, position) => (
              <span
                key={item.id}
                className={cn("size-1.5 rounded-full transition-colors", position === index ? "bg-white" : "bg-white/40")}
              />
            ))}
          </div>
        </>
      )}

      {burst}
    </div>
  );
}
