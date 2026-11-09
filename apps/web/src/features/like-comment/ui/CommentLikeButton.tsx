"use client";

import { FiHeart } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import { useCommentStore } from "@/entities/comment";

interface CommentLikeButtonProps {
  commentId: string;
  postId: string;
  isLiked: boolean;
}

export function CommentLikeButton({ commentId, postId, isLiked }: CommentLikeButtonProps) {
  const toggleCommentLike = useCommentStore((s) => s.toggleCommentLike);

  return (
    <button
      onClick={() => toggleCommentLike(commentId, postId)}
      aria-label={isLiked ? "Unlike comment" : "Like comment"}
      className="p-1 text-zinc-400 hover:text-red-500 pt-1"
    >
      {isLiked ? (
        <FaHeart className="w-3.5 h-3.5 text-red-500" />
      ) : (
        <FiHeart className="w-3.5 h-3.5" />
      )}
    </button>
  );
}
