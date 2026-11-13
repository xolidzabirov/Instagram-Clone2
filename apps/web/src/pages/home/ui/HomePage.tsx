"use client";

import { FEED_MODES, type FeedMode } from "@ig/shared";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PostCardSkeleton } from "@/entities/post";
import { Feed, FeedModeTabs } from "@/widgets/feed";
import { StoriesBar } from "@/widgets/stories-bar";
import { Suggestions } from "@/widgets/suggestions";

function HomeFeed() {
  const variant = useSearchParams()?.get("variant");
  const mode: FeedMode = FEED_MODES.includes(variant as FeedMode) ? (variant as FeedMode) : "home";

  return (
    <>
      <FeedModeTabs mode={mode} />
      <Feed key={mode} mode={mode} />
    </>
  );
}

export function HomePage() {
  return (
    <>
      <div className="w-full max-w-[630px] md:pt-4">
        <StoriesBar />
        <div className="mx-auto w-full max-w-[470px]">
          {/* ?variant= is only known in the browser: the shell shows a loading card meanwhile */}
          <Suspense fallback={<PostCardSkeleton />}>
            <HomeFeed />
          </Suspense>
        </div>
      </div>
      <Suggestions />
    </>
  );
}
