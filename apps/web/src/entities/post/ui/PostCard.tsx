"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { DEFAULT_AVATAR } from "@/shared/config";
import type { MockPost as Post } from "../model/types";
import { FiMessageCircle, FiSend } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import { useFormatCount, useFormatter } from "@/shared/i18n";

interface PostCardProps {
  post: Post;
  /** Like button, provided by the like-post feature */
  likeSlot?: ReactNode;
  /** Save button, provided by the save-post feature */
  saveSlot?: ReactNode;
  onDoubleTap?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
}

export function PostCard({
  post,
  likeSlot,
  saveSlot,
  onDoubleTap,
  onComment,
  onShare,
}: PostCardProps) {
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const formatCount = useFormatCount();
  const format = useFormatter();

  const handleDoubleTap = () => {
    onDoubleTap?.(post.id);
    setShowHeartBurst(true);
    setTimeout(() => setShowHeartBurst(false), 850);
  };

  return (
    <article className="border-b border-zinc-200 dark:border-zinc-800 pb-4 mb-4 select-none">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Image
          src={post.author.avatar ?? DEFAULT_AVATAR}
          unoptimized={!post.author.avatar}
          alt={post.author.username}
          width={34}
          height={34}
          className="rounded-full object-cover w-[34px] h-[34px]"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:underline cursor-pointer">
              {post.author.username}
            </span>
            {post.author.isVerified && (
              <span className="text-blue-500 text-xs">●</span>
            )}
            <span className="text-zinc-400 text-xs">• 2 ч.</span>
          </div>
          {post.location && (
            <p className="text-xs text-zinc-500 truncate">{post.location}</p>
          )}
        </div>
      </div>

      {/* Image with Double Tap */}
      <div
        className="relative aspect-square bg-zinc-100 dark:bg-zinc-900 cursor-pointer overflow-hidden"
        onDoubleClick={handleDoubleTap}
      >
        <Image
          src={post.images[0]?.url ?? ""}
          alt={post.images[0]?.altText ?? post.caption}
          fill
          className="object-cover"
          loading="lazy"
          sizes="(max-width: 470px) 100vw, 470px"
        />

        {/* Double-tap heart animation */}
        {showHeartBurst && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <FaHeart className="w-24 h-24 text-white/95 animate-heart-burst drop-shadow-2xl" />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-4 pt-3">
        <div className="flex items-center gap-4">
          {likeSlot}
          <button
            onClick={() => onComment?.(post.id)}
            aria-label="Comment"
            className="hover:opacity-70 transition-transform active:scale-125"
          >
            <FiMessageCircle className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />
          </button>
          <button
            onClick={() => onShare?.(post.id)}
            aria-label="Share"
            className="hover:opacity-70 transition-transform active:scale-125"
          >
            <FiSend className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />
          </button>
        </div>
        {saveSlot}
      </div>

      {/* Likes */}
      <div className="px-4 pt-2">
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {formatCount(post.likesCount)} отметок «Нравится»
        </span>
      </div>

      {/* Caption */}
      {post.caption && (
        <div className="px-4 pt-1">
          <span className="text-sm leading-relaxed">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {post.author.username}
            </span>{" "}
            <span className="text-zinc-800 dark:text-zinc-200">{post.caption}</span>
          </span>
        </div>
      )}

      {/* Comments link */}
      <button
        className="px-4 pt-1 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 block text-left"
        onClick={() => onComment?.(post.id)}
      >
        {post.commentsCount > 0
          ? `Посмотреть все комментарии (${post.commentsCount})`
          : "Добавить комментарий..."}
      </button>

      {/* Timestamp */}
      <time className="block px-4 pt-1 text-[10px] uppercase text-zinc-400">
        {format.dateTime(new Date(post.createdAt), { day: "numeric", month: "long", year: "numeric" })}
      </time>
    </article>
  );
}
