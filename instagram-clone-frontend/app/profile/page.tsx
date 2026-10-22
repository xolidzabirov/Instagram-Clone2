"use client";

import { useState } from "react";
import { Sidebar } from "@/src/widgets";
import { UserAvatar } from "@/src/entities/user";
import { PostGrid } from "@/src/entities/post";
import { usePostStore } from "@/src/features/post";
import { useAuth } from "@/src/features/auth";
import { useUIStore } from "@/src/features/ui";
import { FiGrid, FiBookmark, FiTag, FiPlusSquare, FiSettings } from "react-icons/fi";
import type { PostPreview } from "@/shared/domain/entities";

export default function ProfilePage() {
  const { user } = useAuth();
  const { posts, savedPostIds, openPostDetail } = usePostStore();
  const { openCreateModal } = useUIStore();
  const [activeTab, setActiveTab] = useState<"posts" | "saved" | "tagged">("posts");

  const username = user?.username || "alex_dev";
  const fullName = user?.fullName || "Alex | Fullstack Engineer";
  const avatar = user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300";

  // Convert posts to previews
  const userPosts: PostPreview[] = posts
    .filter(
      (p) =>
        p.author.username === username ||
        p.author.username === "kholid_official" ||
        p.author.id === user?.id ||
        p.author.id === "current_user" ||
        p.author.id === "u1"
    )
    .map((p) => ({
      id: p.id,
      thumbnailUrl: p.images[0]?.url || "",
      likesCount: p.likesCount,
      commentsCount: p.commentsCount,
      isMultiple: p.images.length > 1,
      isVideo: false,
    }));

  const savedPosts: PostPreview[] = posts
    .filter((p) => savedPostIds.has(p.id))
    .map((p) => ({
      id: p.id,
      thumbnailUrl: p.images[0]?.url || "",
      likesCount: p.likesCount,
      commentsCount: p.commentsCount,
      isMultiple: p.images.length > 1,
      isVideo: false,
    }));

  const currentDisplayPosts = activeTab === "saved" ? savedPosts : userPosts;

  return (
    <div className="flex min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100">
      <Sidebar />
      <main className="flex-1 flex justify-center pl-16 xl:pl-60">
        <div className="w-full max-w-[935px] py-8 px-4 flex flex-col gap-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 sm:gap-14 px-4">
            <div className="relative group cursor-pointer self-center sm:self-auto">
              <UserAvatar
                src={avatar}
                alt={username}
                size="xl"
              />
            </div>

            <div className="flex flex-col gap-5 flex-1">
              <div className="flex flex-wrap items-center gap-4">
                <h1 className="text-xl font-semibold">{username}</h1>
                <button className="px-4 py-1.5 text-sm font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors">
                  Редактировать профиль
                </button>
                <button
                  onClick={openCreateModal}
                  className="px-4 py-1.5 text-sm font-semibold bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <FiPlusSquare className="w-4 h-4" />
                  <span>Создать</span>
                </button>
                <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                  <FiSettings className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-8 text-sm">
                <span>
                  <b className="font-semibold">{userPosts.length}</b> публикаций
                </span>
                <span>
                  <b className="font-semibold">1,248</b> подписчиков
                </span>
                <span>
                  <b className="font-semibold">342</b> подписок
                </span>
              </div>

              <div>
                <p className="font-semibold text-sm">{fullName}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-line">
                  💻 Fullstack Developer • React / Next.js / TypeScript / Node.js
                  {"\n"}🚀 Building high performance web apps
                  {"\n"}📍 Dushanbe, Tajikistan
                </p>
              </div>
            </div>
          </div>

          {/* Highlights */}
          <div className="flex items-center gap-6 px-4 overflow-x-auto no-scrollbar py-2 border-b border-zinc-200 dark:border-zinc-800">
            {[
              { title: "Проекты", img: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=120" },
              { title: "Путешествия", img: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=120" },
              { title: "Дизайн", img: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=120" },
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1 cursor-pointer group">
                <div className="w-16 h-16 rounded-full p-0.5 border border-zinc-300 dark:border-zinc-700 group-hover:scale-105 transition-transform">
                  <img
                    src={item.img}
                    alt={item.title}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {item.title}
                </span>
              </div>
            ))}
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center justify-center border-b border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setActiveTab("posts")}
              className={`flex items-center gap-2 py-3 px-6 text-xs uppercase tracking-wider font-semibold border-t-2 -mt-[1px] transition-colors ${
                activeTab === "posts"
                  ? "border-zinc-900 dark:border-white text-zinc-900 dark:text-white"
                  : "border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              }`}
            >
              <FiGrid className="w-4 h-4" />
              <span>Публикации</span>
            </button>

            <button
              onClick={() => setActiveTab("saved")}
              className={`flex items-center gap-2 py-3 px-6 text-xs uppercase tracking-wider font-semibold border-t-2 -mt-[1px] transition-colors ${
                activeTab === "saved"
                  ? "border-zinc-900 dark:border-white text-zinc-900 dark:text-white"
                  : "border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              }`}
            >
              <FiBookmark className="w-4 h-4" />
              <span>Сохраненное</span>
            </button>

            <button
              onClick={() => setActiveTab("tagged")}
              className={`flex items-center gap-2 py-3 px-6 text-xs uppercase tracking-wider font-semibold border-t-2 -mt-[1px] transition-colors ${
                activeTab === "tagged"
                  ? "border-zinc-900 dark:border-white text-zinc-900 dark:text-white"
                  : "border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              }`}
            >
              <FiTag className="w-4 h-4" />
              <span>Отметки</span>
            </button>
          </div>

          {/* Posts Grid */}
          <div>
            {activeTab === "tagged" ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-2">
                <FiTag className="w-12 h-12 opacity-40" />
                <h3 className="font-bold text-lg text-zinc-800 dark:text-zinc-200">
                  Фото и видео с вами
                </h3>
                <p className="text-sm text-center max-w-sm">
                  Здесь будут появляться фотографии и видео, на которых вас отметили другие пользователи.
                </p>
              </div>
            ) : currentDisplayPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-3">
                {activeTab === "saved" ? (
                  <>
                    <FiBookmark className="w-12 h-12 opacity-40" />
                    <h3 className="font-bold text-lg text-zinc-800 dark:text-zinc-200">
                      Сохраняйте понравившиеся публикации
                    </h3>
                    <p className="text-sm text-center max-w-sm">
                      Сохраняйте фото и видео, чтобы просмотреть их позже. Никто не узнает о том, что вы сохранили.
                    </p>
                  </>
                ) : (
                  <>
                    <FiPlusSquare className="w-12 h-12 opacity-40" />
                    <h3 className="font-bold text-lg text-zinc-800 dark:text-zinc-200">
                      Поделитесь первыми фотографиями
                    </h3>
                    <p className="text-sm text-center max-w-sm">
                      Когда вы делитесь фото, они будут отображаться в вашем профиле.
                    </p>
                    <button
                      onClick={openCreateModal}
                      className="text-sm text-blue-500 font-semibold hover:text-blue-600 mt-2"
                    >
                      Поделитесь первым фото
                    </button>
                  </>
                )}
              </div>
            ) : (
              <PostGrid posts={currentDisplayPosts} onPostClick={openPostDetail} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
