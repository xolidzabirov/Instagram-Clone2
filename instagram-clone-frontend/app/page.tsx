"use client";

import { Sidebar, StoriesBar, Feed, Suggestions } from "@/src/widgets";

export default function Home() {
  return (
    <div className="flex min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100">
      <Sidebar />
      <main className="flex-1 flex justify-center pl-16 xl:pl-60">
        <div className="w-full max-w-[630px] pt-4 px-4">
          <StoriesBar />
          <Feed />
        </div>
        <Suggestions />
      </main>
    </div>
  );
}
