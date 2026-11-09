"use client";

import { create } from "zustand";
import type { UserPreview } from "@ig/shared";
import type { MockPost as Post } from "./types";
import { mockPosts } from "./mocks";

interface PostState {
  posts: Post[];
  selectedPostId: string | null;

  // Actions
  addPost: (newPostData: {
    author: UserPreview;
    imageUrl: string;
    caption: string;
    location?: string;
  }) => void;
  toggleLike: (postId: string) => void;
  toggleSave: (postId: string) => void;
  incrementCommentsCount: (postId: string) => void;
  openPostDetail: (postId: string) => void;
  closePostDetail: () => void;
}

export const usePostStore = create<PostState>((set) => ({
  posts: mockPosts,
  selectedPostId: null,

  addPost: ({ author, imageUrl, caption, location }) => {
    const newPost: Post = {
      id: `post_${Date.now()}`,
      author,
      images: [
        {
          id: `img_${Date.now()}`,
          url: imageUrl,
          width: 1080,
          height: 1080,
          altText: caption,
        },
      ],
      caption,
      likesCount: 0,
      commentsCount: 0,
      isLiked: false,
      isSaved: false,
      location: location || undefined,
      tags: caption
        .split(" ")
        .filter((word) => word.startsWith("#"))
        .map((tag) => tag.replace("#", "")),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({ posts: [newPost, ...state.posts] }));
  },

  toggleLike: (postId) => {
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likesCount: post.isLiked ? post.likesCount - 1 : post.likesCount + 1,
            }
          : post
      ),
    }));
  },

  toggleSave: (postId) => {
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId ? { ...post, isSaved: !post.isSaved } : post
      ),
    }));
  },

  incrementCommentsCount: (postId) => {
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p
      ),
    }));
  },

  openPostDetail: (postId) => set({ selectedPostId: postId }),
  closePostDetail: () => set({ selectedPostId: null }),
}));
