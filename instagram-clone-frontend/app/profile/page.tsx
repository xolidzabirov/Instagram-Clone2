"use client";

import { Sidebar } from "@/src/widgets";
import { UserAvatar } from "@/src/entities/user";
import { PostGrid } from "@/src/entities/post";
import type { PostPreview } from "@/shared/domain/entities";

const mockUserPosts: PostPreview[] = [
  {
    id: "p1",
    thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500",
    likesCount: 142,
    commentsCount: 18,
    isMultiple: false,
    isVideo: false,
  },
  {
    id: "p2",
    thumbnailUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500",
    likesCount: 520,
    commentsCount: 34,
    isMultiple: true,
    isVideo: false,
  },
];

export default function ProfilePage() {
  return (
    <div className="flex min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100">
      <Sidebar />
      <main className="flex-1 flex justify-center pl-16 xl:pl-60">
        <div className="w-full max-w-[935px] py-8 px-4 flex flex-col gap-8">
          {/* Header */}
          <div className="flex items-center gap-12 px-4">
            <UserAvatar
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300"
              alt="Profile"
              size="xl"
            />
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold">my_username</h2>
                <button className="px-4 py-1.5 text-sm font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg">
                  Редактировать профиль
                </button>
              </div>

              <div className="flex items-center gap-8 text-sm">
                <span><b>2</b> публикаций</span>
                <span><b>240</b> подписчиков</span>
                <span><b>180</b> подписок</span>
              </div>

              <div>
                <p className="font-semibold text-sm">Frontend Developer</p>
                <p className="text-sm text-zinc-500">React • Next.js • TypeScript • FSD</p>
              </div>
            </div>
          </div>

          {/* Posts Grid */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
            <PostGrid posts={mockUserPosts} />
          </div>
        </div>
      </main>
    </div>
  );
}
