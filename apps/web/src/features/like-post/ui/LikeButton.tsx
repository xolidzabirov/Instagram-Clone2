"use client";

import { FiHeart } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import { useLikePost } from "../model/useLikePost";

interface LikeButtonProps {
  postId: string;
  isLiked: boolean;
}

export function LikeButton({ postId, isLiked }: LikeButtonProps) {
  const { toggleLike } = useLikePost();

  return (
    <button
      onClick={() => toggleLike(postId)}
      aria-label={isLiked ? "Unlike" : "Like"}
      className="hover:opacity-70 transition-transform active:scale-125"
    >
      {isLiked ? (
        <FaHeart className="w-6 h-6 text-red-500" />
      ) : (
        <FiHeart className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />
      )}
    </button>
  );
}
