"use client";

import { useState } from "react";
import { PostCard } from "@/src/entities/post";
import type { Post } from "@/shared/domain/entities";

const mockPosts: Post[] = [
  {
    id: "p1",
    author: {
      id: "u1",
      username: "alex_dev",
      fullName: "Alex",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100",
      isVerified: true,
    },
    images: [
      {
        id: "img1",
        url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800",
        width: 800,
        height: 800,
      },
    ],
    caption: "Building a scalable Fullstack Instagram clone with FSD architecture 🚀 #coding #nextjs",
    likesCount: 142,
    commentsCount: 18,
    isLiked: false,
    isSaved: false,
    location: "Dushanbe, Tajikistan",
    tags: ["coding", "nextjs"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "p2",
    author: {
      id: "u2",
      username: "travel_world",
      fullName: "Travel World",
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100",
      isVerified: true,
    },
    images: [
      {
        id: "img2",
        url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800",
        width: 800,
        height: 800,
      },
    ],
    caption: "Breathtaking landscapes and serene mountains 🏔️ #nature #mountains",
    likesCount: 520,
    commentsCount: 34,
    isLiked: true,
    isSaved: true,
    location: "Pamir Mountains",
    tags: ["nature", "mountains"],
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
];

export function Feed() {
  const [posts, setPosts] = useState<Post[]>(mockPosts);

  const handleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              isLiked: !p.isLiked,
              likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1,
            }
          : p
      )
    );
  };

  return (
    <div className="flex flex-col max-w-[470px] w-full mx-auto pt-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onLike={handleLike} />
      ))}
    </div>
  );
}
