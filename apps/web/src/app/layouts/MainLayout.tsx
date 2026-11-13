import type { ReactNode } from "react";
import { AppNavigation } from "@/widgets/navigation";
import { PostDetailModal } from "@/widgets/post-detail";
import { StoryViewerModal } from "@/widgets/story-viewer";
import { CreatePostModal } from "@/features/create-post";

/** Shell of every signed-in page: navigation plus the app-wide modals */
export function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <AppNavigation />
      {/* Offsets match the navigation: bars above and below on phones, a sidebar from md */}
      <main className="flex min-h-dvh justify-center pb-12 pt-14 md:pb-0 md:pl-[72px] md:pt-0 xl:pl-[244px]">
        {children}
      </main>
      <CreatePostModal />
      <PostDetailModal />
      <StoryViewerModal />
    </div>
  );
}
