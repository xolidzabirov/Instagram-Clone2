"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { FiX, FiMessageCircle, FiSend, FiMoreHorizontal } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import { DEFAULT_AVATAR } from "@/shared/config";
import { usePostStore } from "@/entities/post";
import { CommentItem, useCommentStore } from "@/entities/comment";
import { LikeButton, useLikePost } from "@/features/like-post";
import { SaveButton } from "@/features/save-post";
import { AddCommentForm } from "@/features/add-comment";
import { CommentLikeButton } from "@/features/like-comment";
import { useFormatCount, useFormatter } from "@/shared/i18n";

export function PostDetailModal() {
  const selectedPostId = usePostStore((s) => s.selectedPostId);
  return selectedPostId ? <PostDetailDialog postId={selectedPostId} /> : null;
}

function PostDetailDialog({ postId }: { postId: string }) {
  const post = usePostStore((s) => s.posts.find((p) => p.id === postId));
  const closePostDetail = usePostStore((s) => s.closePostDetail);
  const comments = useCommentStore((s) => s.commentsByPost[postId]);
  const { likeOnce } = useLikePost();
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const format = useFormatter();
  const formatCount = useFormatCount();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePostDetail();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closePostDetail]);

  if (!post) return null;

  const handleDoubleTap = () => {
    likeOnce(post.id);
    setShowHeartBurst(true);
    setTimeout(() => setShowHeartBurst(false), 850);
  };

  const authorAvatar = post.author.avatar ?? DEFAULT_AVATAR;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in"
      onClick={closePostDetail}
    >
      <button
        onClick={closePostDetail}
        className="absolute top-4 right-4 text-white hover:opacity-80 p-2 z-50 cursor-pointer"
        aria-label="Закрыть"
      >
        <FiX className="w-8 h-8" />
      </button>

      <div
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xl max-w-5xl w-full h-[85vh] max-h-[720px] flex flex-col md:flex-row relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Media */}
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
          {showHeartBurst && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
              <FaHeart className="w-28 h-28 text-white animate-heart-burst drop-shadow-2xl" />
            </div>
          )}
        </div>

        {/* Details & comments */}
        <div className="w-full md:w-[420px] flex flex-col justify-between bg-white dark:bg-black border-t md:border-t-0 md:border-l border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between p-3.5 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full overflow-hidden relative border border-zinc-200 dark:border-zinc-700">
                <Image src={authorAvatar} unoptimized={!post.author.avatar} alt={post.author.username} fill className="object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                  {post.author.username}
                </span>
                {post.location && <span className="text-xs text-zinc-500">{post.location}</span>}
              </div>
            </div>
            <button className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 p-1" aria-label="Ещё">
              <FiMoreHorizontal className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Caption as the first comment */}
            {post.caption && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden relative flex-shrink-0">
                  <Image src={authorAvatar} unoptimized={!post.author.avatar} alt={post.author.username} fill className="object-cover" />
                </div>
                <div className="text-sm">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 mr-2">{post.author.username}</span>
                  <span className="text-zinc-800 dark:text-zinc-200 leading-relaxed">{post.caption}</span>
                  <div className="text-[11px] text-zinc-400 mt-1">
                    {format.dateTime(new Date(post.createdAt), { day: "numeric", month: "short" })}
                  </div>
                </div>
              </div>
            )}

            {(comments ?? []).map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                likeSlot={<CommentLikeButton commentId={comment.id} postId={post.id} isLiked={comment.isLiked} />}
              />
            ))}
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-800 p-3.5 bg-zinc-50/50 dark:bg-zinc-950/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4">
                <LikeButton postId={post.id} isLiked={post.isLiked} />
                <button className="hover:opacity-70" aria-label="Comment">
                  <FiMessageCircle className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />
                </button>
                <button className="hover:opacity-70" aria-label="Share">
                  <FiSend className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />
                </button>
              </div>
              <SaveButton postId={post.id} isSaved={post.isSaved} />
            </div>
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {formatCount(post.likesCount)} отметок «Нравится»
            </div>
            <div className="text-[10px] uppercase text-zinc-400 tracking-wide mt-0.5">
              {format.dateTime(new Date(post.createdAt), { year: "numeric", month: "long", day: "numeric" })}
            </div>
          </div>

          <AddCommentForm postId={post.id} />
        </div>
      </div>
    </div>
  );
}
