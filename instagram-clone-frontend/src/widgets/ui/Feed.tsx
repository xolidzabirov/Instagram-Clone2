"use client";

import { PostCard } from "@/src/entities/post";
import { usePostStore } from "@/src/features/post";

export function Feed() {
  const { posts, toggleLike, toggleSave, openPostDetail } = usePostStore();

  return (
    <div className="flex flex-col max-w-[470px] w-full mx-auto pt-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onLike={() => toggleLike(post.id)}
          onComment={() => openPostDetail(post.id)}
          onSave={() => toggleSave(post.id)}
        />
      ))}
    </div>
  );
}

