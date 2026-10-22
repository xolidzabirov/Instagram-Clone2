"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { 
  FiX, 
  FiHeart, 
  FiMessageCircle, 
  FiSend, 
  FiBookmark, 
  FiSmile,
  FiMoreHorizontal 
} from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import { usePostStore } from "@/src/features/post";

export function PostDetailModal() {
  const {
    posts,
    comments,
    selectedPostId,
    closePostDetail,
    toggleLike,
    toggleSave,
    addComment,
    toggleCommentLike,
  } = usePostStore();

  const [commentInput, setCommentInput] = useState<string>("");
  const [showHeartBurst, setShowHeartBurst] = useState<boolean>(false);

  useEffect(() => {
    if (!selectedPostId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePostDetail();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPostId, closePostDetail]);

  if (!selectedPostId) return null;

  const post = posts.find((p) => p.id === selectedPostId);
  if (!post) return null;

  const postComments = comments[post.id] || [];

  const handleDoubleTap = () => {
    if (!post.isLiked) {
      toggleLike(post.id);
    }
    setShowHeartBurst(true);
    setTimeout(() => setShowHeartBurst(false), 850);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    addComment(post.id, commentInput);
    setCommentInput("");
  };

  const insertEmoji = (emoji: string) => {
    setCommentInput((prev) => prev + emoji);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={closePostDetail}
    >
      {/* Close button outside */}
      <button
        onClick={closePostDetail}
        className="absolute top-4 right-4 text-white hover:opacity-80 p-2 z-50 cursor-pointer"
        aria-label="Закрыть"
      >
        <FiX className="w-8 h-8" />
      </button>

      {/* Modal Dialog */}
      <div
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xl max-w-5xl w-full h-[85vh] max-h-[720px] flex flex-col md:flex-row relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Side: Media */}
        <div
          className="relative flex-1 bg-black flex items-center justify-center cursor-pointer select-none overflow-hidden"
          onDoubleClick={handleDoubleTap}
        >
          <Image
            src={post.images[0]?.url || ""}
            alt={post.caption}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 60vw"
            priority
          />

          {/* Heart burst on double click */}
          {showHeartBurst && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
              <FaHeart className="w-28 h-28 text-white animate-heart-burst drop-shadow-2xl" />
            </div>
          )}
        </div>

        {/* Right Side: Details & Comments */}
        <div className="w-full md:w-[420px] flex flex-col justify-between bg-white dark:bg-black border-t md:border-t-0 md:border-l border-zinc-200 dark:border-zinc-800">
          {/* Header */}
          <div className="flex items-center justify-between p-3.5 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full overflow-hidden relative border border-zinc-200 dark:border-zinc-700">
                <Image
                  src={post.author.avatar}
                  alt={post.author.username}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                  {post.author.username}
                </span>
                {post.location && (
                  <span className="text-xs text-zinc-500">{post.location}</span>
                )}
              </div>
            </div>

            <button className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 p-1">
              <FiMoreHorizontal className="w-5 h-5" />
            </button>
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Caption as first comment */}
            {post.caption && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden relative flex-shrink-0">
                  <Image
                    src={post.author.avatar}
                    alt={post.author.username}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="text-sm">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 mr-2">
                    {post.author.username}
                  </span>
                  <span className="text-zinc-800 dark:text-zinc-200 leading-relaxed">
                    {post.caption}
                  </span>
                  <div className="text-[11px] text-zinc-400 mt-1">
                    {new Date(post.createdAt).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "short",
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* List of user comments */}
            {postComments.map((c) => (
              <div key={c.id} className="flex items-start justify-between gap-2 group">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden relative flex-shrink-0">
                    <Image
                      src={c.author.avatar}
                      alt={c.author.username}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 mr-2">
                      {c.author.username}
                    </span>
                    <span className="text-zinc-800 dark:text-zinc-200">{c.text}</span>
                    <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-1">
                      <span>
                        {new Date(c.createdAt).toLocaleTimeString("ru-RU", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {c.likesCount > 0 && (
                        <span>Ответов: {c.likesCount}</span>
                      )}
                      <button className="hover:text-zinc-600 font-semibold">Ответить</button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => toggleCommentLike(c.id, post.id)}
                  className="p-1 text-zinc-400 hover:text-red-500 pt-1"
                >
                  {c.isLiked ? (
                    <FaHeart className="w-3.5 h-3.5 text-red-500" />
                  ) : (
                    <FiHeart className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Action Row & Like Info */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 p-3.5 bg-zinc-50/50 dark:bg-zinc-950/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => toggleLike(post.id)}
                  className="hover:scale-110 active:scale-90 transition-transform"
                >
                  {post.isLiked ? (
                    <FaHeart className="w-6 h-6 text-red-500" />
                  ) : (
                    <FiHeart className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />
                  )}
                </button>
                <button className="hover:scale-110 active:scale-90 transition-transform">
                  <FiMessageCircle className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />
                </button>
                <button className="hover:scale-110 active:scale-90 transition-transform">
                  <FiSend className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />
                </button>
              </div>

              <button
                onClick={() => toggleSave(post.id)}
                className="hover:scale-110 active:scale-90 transition-transform"
              >
                {post.isSaved ? (
                  <FiBookmark className="w-6 h-6 fill-zinc-900 dark:fill-zinc-100" />
                ) : (
                  <FiBookmark className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />
                )}
              </button>
            </div>

            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {post.likesCount.toLocaleString()} отметок «Нравится»
            </div>
            <div className="text-[10px] uppercase text-zinc-400 tracking-wide mt-0.5">
              {new Date(post.createdAt).toLocaleDateString("ru-RU", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>

          {/* Comment Form */}
          <form
            onSubmit={handleCommentSubmit}
            className="border-t border-zinc-200 dark:border-zinc-800 p-3 flex flex-col gap-2 bg-white dark:bg-black"
          >
            {/* Quick emoji row */}
            <div className="flex items-center gap-2 text-base px-1">
              {["❤️", "🔥", "👏", "😍", "🙌", "✨"].map((emoji) => (
                <button
                  type="button"
                  key={emoji}
                  onClick={() => insertEmoji(emoji)}
                  className="hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <FiSmile className="w-5 h-5 text-zinc-400 flex-shrink-0" />
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Добавьте комментарий..."
                className="w-full text-sm bg-transparent outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
              />
              <button
                type="submit"
                disabled={!commentInput.trim()}
                className="text-sm font-semibold text-blue-500 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-blue-500"
              >
                Опубликовать
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
