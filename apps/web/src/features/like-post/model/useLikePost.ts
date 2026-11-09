"use client";

import { usePostStore } from "@/entities/post";

export function useLikePost() {
  const toggleLike = usePostStore((s) => s.toggleLike);

  // Double tap only ever likes, it never removes a like
  const likeOnce = (postId: string) => {
    const post = usePostStore.getState().posts.find((p) => p.id === postId);
    if (post && !post.isLiked) toggleLike(postId);
  };

  return { toggleLike, likeOnce };
}
