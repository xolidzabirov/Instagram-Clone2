import type { ReactNode } from "react";
import { Sidebar } from "@/widgets/sidebar";
import { PostDetailModal } from "@/widgets/post-detail";
import { StoryViewerModal } from "@/widgets/story-viewer";
import { CreatePostModal } from "@/features/create-post";

/** Shell of every signed-in page: navigation plus the app-wide modals */
export function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100">
      <Sidebar />
      <main className="flex-1 flex justify-center pl-16 xl:pl-60">{children}</main>
      <CreatePostModal />
      <PostDetailModal />
      <StoryViewerModal />
    </div>
  );
}
