"use client";

import type { PostPreview } from "@ig/shared";
import Image from "next/image";
import { useFormatCount, useTranslations } from "@/shared/i18n";
import { CarouselIcon, CommentFilledIcon, HeartIcon, PinIcon, ReelsIcon, Skeleton } from "@/shared/ui";

interface PostGridProps {
  posts: PostPreview[];
  onPostClick?: (postId: string) => void;
}

/** Profile grid: 3 columns of 3:4 tiles like Instagram since 2025, with type icons and hover counters */
export function PostGrid({ posts, onPostClick }: PostGridProps) {
  const formatCount = useFormatCount();
  const t = useTranslations("profile");

  return (
    <div className="grid grid-cols-3 gap-[3px] md:gap-1">
      {posts.map((post, index) => (
        <button
          key={post.id}
          type="button"
          onClick={() => onPostClick?.(post.id)}
          className="group relative aspect-[3/4] overflow-hidden bg-control focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
        >
          {post.thumbnail && (
            <Image
              src={post.thumbnail}
              alt=""
              fill
              sizes="(max-width: 767px) 33vw, 309px"
              // The first row is above the fold on every screen
              loading={index < 3 ? "eager" : "lazy"}
              // A failed image leaves the grey tile instead of the browser's broken-image icon
              onError={(event) => {
                event.currentTarget.style.visibility = "hidden";
              }}
              className="object-cover"
            />
          )}

          <span className="absolute right-2 top-2 flex gap-1 text-white drop-shadow-[0_0_2px_rgba(0,0,0,0.5)] [&>svg]:size-5">
            {post.isPinned && <PinIcon aria-label={t("pinned")} role="img" aria-hidden={false} />}
            {post.type === "REEL" || post.isVideo ? (
              <ReelsIcon filled aria-label={t("reel")} role="img" aria-hidden={false} />
            ) : (
              post.isMultiple && <CarouselIcon aria-label={t("carousel")} role="img" aria-hidden={false} />
            )}
          </span>

          <span className="absolute inset-0 flex items-center justify-center gap-7 bg-black/30 text-base font-bold text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            {post.likesCount !== null && (
              <span className="flex items-center gap-1.5">
                <HeartIcon filled className="size-5" />
                {formatCount(post.likesCount)}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <CommentFilledIcon className="size-5 -scale-x-100" />
              {formatCount(post.commentsCount)}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}

export function PostGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-[3px] md:gap-1" aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className="aspect-[3/4] rounded-none" />
      ))}
    </div>
  );
}
