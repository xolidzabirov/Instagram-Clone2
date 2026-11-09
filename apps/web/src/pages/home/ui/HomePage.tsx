"use client";

import { Feed } from "@/widgets/feed";
import { StoriesBar } from "@/widgets/stories-bar";
import { Suggestions } from "@/widgets/suggestions";

export function HomePage() {
  return (
    <>
      <div className="w-full max-w-[630px] pt-4 px-4">
        <StoriesBar />
        <Feed />
      </div>
      <Suggestions />
    </>
  );
}
