"use client";

import { useState } from "react";
import Image from "next/image";
import { Sidebar } from "@/src/widgets";
import { usePostStore } from "@/src/features/post";
import { FiHeart, FiMessageCircle, FiSearch, FiFilm } from "react-icons/fi";

const EXPLORE_TAGS = [
  "Все",
  "Дизайн",
  "Путешествия",
  "Архитектура",
  "Код",
  "Природа",
  "Арт",
  "Киберпанк",
  "Авто",
];

const EXPLORE_ITEMS = [
  {
    id: "exp_1",
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800",
    likes: 4200,
    comments: 138,
    isLarge: true,
    isVideo: false,
  },
  {
    id: "exp_2",
    imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600",
    likes: 1950,
    comments: 64,
    isLarge: false,
    isVideo: false,
  },
  {
    id: "exp_3",
    imageUrl: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600",
    likes: 3100,
    comments: 92,
    isLarge: false,
    isVideo: true,
  },
  {
    id: "exp_4",
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600",
    likes: 840,
    comments: 29,
    isLarge: false,
    isVideo: false,
  },
  {
    id: "exp_5",
    imageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600",
    likes: 2400,
    comments: 75,
    isLarge: false,
    isVideo: false,
  },
  {
    id: "exp_6",
    imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800",
    likes: 5120,
    comments: 210,
    isLarge: true,
    isVideo: true,
  },
  {
    id: "exp_7",
    imageUrl: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600",
    likes: 1280,
    comments: 48,
    isLarge: false,
    isVideo: false,
  },
  {
    id: "exp_8",
    imageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600",
    likes: 3740,
    comments: 115,
    isLarge: false,
    isVideo: false,
  },
  {
    id: "exp_9",
    imageUrl: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600",
    likes: 980,
    comments: 31,
    isLarge: false,
    isVideo: false,
  },
];

export default function ExplorePage() {
  const [selectedTag, setSelectedTag] = useState("Все");
  const { openPostDetail, posts } = usePostStore();

  const handleOpenItem = (id: string) => {
    // If id exists in store, open it, otherwise pick first post or post by id
    const found = posts.find((p) => p.id === id);
    if (found) {
      openPostDetail(found.id);
    } else if (posts.length > 0) {
      openPostDetail(posts[0].id);
    }
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100">
      <Sidebar />
      <main className="flex-1 flex justify-center pl-16 xl:pl-60">
        <div className="w-full max-w-[975px] py-6 px-4 flex flex-col gap-6">
          {/* Tag filters */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {EXPLORE_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedTag === tag
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Explore Mosaic Grid */}
          <div className="grid grid-cols-3 gap-1 sm:gap-2 auto-rows-[140px] sm:auto-rows-[240px] md:auto-rows-[300px]">
            {EXPLORE_ITEMS.map((item, index) => {
              // Apply classic Instagram 2x2 feature pattern every 6th item
              const isFeature = index % 6 === 0;

              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenItem(item.id)}
                  className={`relative group bg-zinc-100 dark:bg-zinc-900 overflow-hidden cursor-pointer rounded-sm ${
                    isFeature ? "col-span-2 row-span-2" : "col-span-1 row-span-1"
                  }`}
                >
                  <Image
                    src={item.imageUrl}
                    alt="Explore item"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />

                  {item.isVideo && (
                    <div className="absolute top-3 right-3 text-white drop-shadow p-1">
                      <FiFilm className="w-5 h-5" />
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
                    <span className="flex items-center gap-1.5 text-white font-semibold text-sm drop-shadow">
                      <FiHeart className="w-5 h-5 fill-white" />
                      {item.likes.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1.5 text-white font-semibold text-sm drop-shadow">
                      <FiMessageCircle className="w-5 h-5 fill-white" />
                      {item.comments.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
