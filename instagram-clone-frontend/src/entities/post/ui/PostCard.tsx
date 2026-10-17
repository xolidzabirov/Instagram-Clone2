"use client";

import Image from "next/image";
import type { Post } from "@/shared/domain/entities";
import { FiHeart, FiMessageCircle, FiSend, FiBookmark } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";

interface PostCardProps {
  post: Post;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onSave?: (postId: string) => void;
}

export function PostCard({ post, onLike, onComment, onShare, onSave }: PostCardProps) {
  return (
    <article className="border-b border-zinc-200 dark:border-zinc-800 pb-4 mb-4">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Image
          src={post.author.avatar}
          alt={post.author.username}
          width={32}
          height={32}
          className="rounded-full object-cover"
        />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {post.author.username}
          </span>
          {post.location && (
            <p className="text-xs text-zinc-500">{post.location}</p>
          )}
        </div>
      </div>

      {/* Image */}
      <div className="relative aspect-square bg-zinc-100 dark:bg-zinc-900">
        <Image
          src={post.images[0]?.url ?? ""}
          alt={post.images[0]?.altText ?? post.caption}
          fill
          className="object-cover"
          loading="lazy"
          sizes="(max-width: 470px) 100vw, 470px"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-4 pt-3">
        <div className="flex items-center gap-4">
          <button onClick={() => onLike?.(post.id)} aria-label="Like">
            {post.isLiked ? (
              <FaHeart className="w-6 h-6 text-red-500" />
            ) : (
              <FiHeart className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />
            )}
          </button>
          <button onClick={() => onComment?.(post.id)} aria-label="Comment">
            <FiMessageCircle className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />
          </button>
          <button onClick={() => onShare?.(post.id)} aria-label="Share">
            <FiSend className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />
          </button>
        </div>
        <button onClick={() => onSave?.(post.id)} aria-label="Save">
          <FiBookmark className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />
        </button>
      </div>

      {/* Likes */}
      <div className="px-4 pt-2">
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {post.likesCount.toLocaleString()} likes
        </span>
      </div>

      {/* Caption */}
      {post.caption && (
        <div className="px-4 pt-1">
          <span className="text-sm">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {post.author.username}
            </span>{" "}
            <span className="text-zinc-800 dark:text-zinc-200">{post.caption}</span>
          </span>
        </div>
      )}

      {/* Comments link */}
      {post.commentsCount > 0 && (
        <button
          className="px-4 pt-1 text-sm text-zinc-500"
          onClick={() => onComment?.(post.id)}
        >
          View all {post.commentsCount} comments
        </button>
      )}

      {/* Timestamp */}
      <time className="block px-4 pt-1 text-[10px] uppercase text-zinc-400">
        {new Date(post.createdAt).toLocaleDateString()}
      </time>
    </article>
  );
}
