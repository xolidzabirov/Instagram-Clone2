"use client";

import { useState } from "react";
import Image from "next/image";
import { Sidebar } from "@/src/widgets";
import { UserAvatar } from "@/src/entities/user";
import { 
  FiHeart, 
  FiMessageCircle, 
  FiSend, 
  FiBookmark, 
  FiMoreHorizontal, 
  FiVolume2, 
  FiVolumeX, 
  FiMusic 
} from "react-icons/fi";
import { FaHeart } from "react-icons/fa";

interface ReelItem {
  id: string;
  creator: {
    username: string;
    avatar: string;
  };
  caption: string;
  musicTitle: string;
  imageUrl: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isSaved: boolean;
  isFollowing: boolean;
}

const INITIAL_REELS: ReelItem[] = [
  {
    id: "r1",
    creator: {
      username: "code_master",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120",
    },
    caption: "Modern Web Development with Next.js & TypeScript 🔥 Check this slick animation out! #webdev #frontend #nextjs",
    musicTitle: "Original Audio — Lo-Fi Chill Beats",
    imageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1080",
    likesCount: 14200,
    commentsCount: 380,
    isLiked: false,
    isSaved: false,
    isFollowing: false,
  },
  {
    id: "r2",
    creator: {
      username: "travel_world",
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120",
    },
    caption: "Breathtaking views from 4,000 meters high. Earth is truly mesmerizing 🏔️✈️ #travel #nature #drone",
    musicTitle: "Hans Zimmer — Time (Ambient Remix)",
    imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1080",
    likesCount: 52400,
    commentsCount: 890,
    isLiked: true,
    isSaved: true,
    isFollowing: true,
  },
  {
    id: "r3",
    creator: {
      username: "sarah_design",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120",
    },
    caption: "3 UI design tips that will instantly make your apps look 10x more premium ✨ #design #ui #ux",
    musicTitle: "Synthwave Vibe — Retro Future",
    imageUrl: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1080",
    likesCount: 8920,
    commentsCount: 154,
    isLiked: false,
    isSaved: false,
    isFollowing: false,
  },
];

export default function ReelsPage() {
  const [reels, setReels] = useState<ReelItem[]>(INITIAL_REELS);
  const [isMuted, setIsMuted] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState<string | null>(null);

  const toggleLike = (id: string) => {
    setReels((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const nextLiked = !r.isLiked;
          return {
            ...r,
            isLiked: nextLiked,
            likesCount: nextLiked ? r.likesCount + 1 : r.likesCount - 1,
          };
        }
        return r;
      })
    );
  };

  const toggleSave = (id: string) => {
    setReels((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isSaved: !r.isSaved } : r))
    );
  };

  const toggleFollow = (id: string) => {
    setReels((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isFollowing: !r.isFollowing } : r))
    );
  };

  const handleDoubleTap = (id: string) => {
    const reel = reels.find((r) => r.id === id);
    if (reel && !reel.isLiked) {
      toggleLike(id);
    }
    setShowHeartBurst(id);
    setTimeout(() => setShowHeartBurst(null), 850);
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100">
      <Sidebar />
      <main className="flex-1 flex justify-center pl-16 xl:pl-60 py-6">
        <div className="flex flex-col gap-8 w-full max-w-[420px] px-2">
          {reels.map((reel) => (
            <div
              key={reel.id}
              className="flex items-end gap-3 h-[740px] max-h-[88vh]"
            >
              {/* Main Reel Video Card */}
              <div
                className="relative flex-1 h-full bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl cursor-pointer select-none group"
                onDoubleClick={() => handleDoubleTap(reel.id)}
              >
                <Image
                  src={reel.imageUrl}
                  alt={reel.caption}
                  fill
                  className="object-cover"
                  priority
                />

                {/* Double Tap Heart Burst */}
                {showHeartBurst === reel.id && (
                  <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                    <FaHeart className="w-24 h-24 text-white/95 animate-heart-burst drop-shadow-2xl" />
                  </div>
                )}

                {/* Sound Mute Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted(!isMuted);
                  }}
                  className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors backdrop-blur-sm"
                  aria-label="Включить / выключить звук"
                >
                  {isMuted ? <FiVolumeX className="w-5 h-5" /> : <FiVolume2 className="w-5 h-5" />}
                </button>

                {/* Dark Gradient Overlay for readability */}
                <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />

                {/* Info & Creator */}
                <div className="absolute inset-x-0 bottom-0 p-5 text-white flex flex-col gap-3 z-10">
                  {/* Creator Bar */}
                  <div className="flex items-center gap-3">
                    <UserAvatar src={reel.creator.avatar} alt={reel.creator.username} size="sm" />
                    <span className="font-semibold text-sm hover:underline">
                      {reel.creator.username}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFollow(reel.id);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        reel.isFollowing
                          ? "bg-white/20 text-white hover:bg-white/30"
                          : "border border-white text-white hover:bg-white/20"
                      }`}
                    >
                      {reel.isFollowing ? "Подписки" : "Подписаться"}
                    </button>
                  </div>

                  {/* Caption */}
                  <p className="text-xs text-white/95 line-clamp-2 leading-relaxed">
                    {reel.caption}
                  </p>

                  {/* Audio Track */}
                  <div className="flex items-center gap-2 text-xs text-white/80">
                    <FiMusic className="w-3.5 h-3.5 flex-shrink-0 animate-pulse" />
                    <span className="truncate">{reel.musicTitle}</span>
                  </div>
                </div>
              </div>

              {/* Side Action Bar */}
              <div className="flex flex-col items-center gap-5 pb-2">
                {/* Like */}
                <button
                  onClick={() => toggleLike(reel.id)}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="p-2.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                    {reel.isLiked ? (
                      <FaHeart className="w-6 h-6 text-red-500 transform group-active:scale-125 transition-transform" />
                    ) : (
                      <FiHeart className="w-6 h-6 text-zinc-900 dark:text-zinc-100 group-active:scale-125 transition-transform" />
                    )}
                  </div>
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    {reel.likesCount.toLocaleString()}
                  </span>
                </button>

                {/* Comment */}
                <button className="flex flex-col items-center gap-1 group">
                  <div className="p-2.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                    <FiMessageCircle className="w-6 h-6 text-zinc-900 dark:text-zinc-100 group-active:scale-125 transition-transform" />
                  </div>
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    {reel.commentsCount}
                  </span>
                </button>

                {/* Share */}
                <button className="flex flex-col items-center gap-1 group">
                  <div className="p-2.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                    <FiSend className="w-6 h-6 text-zinc-900 dark:text-zinc-100 group-active:scale-125 transition-transform" />
                  </div>
                </button>

                {/* Bookmark */}
                <button
                  onClick={() => toggleSave(reel.id)}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="p-2.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                    <FiBookmark
                      className={`w-6 h-6 group-active:scale-125 transition-transform ${
                        reel.isSaved
                          ? "fill-zinc-900 dark:fill-zinc-100 text-zinc-900 dark:text-zinc-100"
                          : "text-zinc-900 dark:text-zinc-100"
                      }`}
                    />
                  </div>
                </button>

                {/* More */}
                <button className="p-2.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                  <FiMoreHorizontal className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                </button>

                {/* Audio Disc avatar */}
                <div className="w-7 h-7 rounded-md border-2 border-zinc-900 dark:border-zinc-100 overflow-hidden mt-1 shadow">
                  <img
                    src={reel.creator.avatar}
                    alt="Audio"
                    className="w-full h-full object-cover animate-spin [animation-duration:4s]"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
