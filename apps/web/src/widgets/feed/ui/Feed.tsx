"use client";

import { PostCard, usePostStore } from "@/entities/post";
import { LikeButton, useLikePost } from "@/features/like-post";
import { SaveButton } from "@/features/save-post";

export function Feed() {
  const posts = usePostStore((s) => s.posts);
  const openPostDetail = usePostStore((s) => s.openPostDetail);
  const { likeOnce } = useLikePost();

  return (
    <div className="flex flex-col max-w-[470px] w-full mx-auto pt-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          likeSlot={<LikeButton postId={post.id} isLiked={post.isLiked} />}
          saveSlot={<SaveButton postId={post.id} isSaved={post.isSaved} />}
          onDoubleTap={likeOnce}
          onComment={openPostDetail}
        />
      ))}
    </div>
  );
}
