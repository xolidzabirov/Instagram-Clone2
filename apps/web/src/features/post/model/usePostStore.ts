"use client";

import { create } from "zustand";
import type { Post, Comment, PostPreview } from "@ig/shared";

const INITIAL_POSTS: Post[] = [
  {
    id: "p1",
    author: {
      id: "u1",
      username: "alex_dev",
      fullName: "Alex",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120",
      isVerified: true,
    },
    images: [
      {
        id: "img1",
        url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080",
        width: 1080,
        height: 1080,
        altText: "3D digital landscape aesthetic",
      },
    ],
    caption: "Разработка полнофункционального Instagram-клона с современной архитектурой FSD и Next.js 16! 🚀💻 #nextjs #fullstack #coding",
    likesCount: 184,
    commentsCount: 3,
    isLiked: false,
    isSaved: false,
    location: "Душанбе, Таджикистан",
    tags: ["nextjs", "fullstack", "coding"],
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: "p2",
    author: {
      id: "u2",
      username: "travel_world",
      fullName: "Travel World",
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120",
      isVerified: true,
    },
    images: [
      {
        id: "img2",
        url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1080",
        width: 1080,
        height: 1080,
        altText: "Mountain lake sunset",
      },
    ],
    caption: "Завораживающие горные пейзажи и чистейший воздух. Место, куда хочется возвращаться снова и снова 🏔️✨ #nature #mountains #travel",
    likesCount: 542,
    commentsCount: 2,
    isLiked: true,
    isSaved: true,
    location: "Памирские горы",
    tags: ["nature", "mountains", "travel"],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  },
  {
    id: "p3",
    author: {
      id: "u3",
      username: "sarah_design",
      fullName: "Sarah Designer",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120",
      isVerified: false,
    },
    images: [
      {
        id: "img3",
        url: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1080",
        width: 1080,
        height: 1080,
        altText: "Design workspace aesthetic",
      },
    ],
    caption: "Новый проект интерфейса готов. Внимание к каждой детали и минимализм — ключ к успеху! 🎨✨ #ui #ux #design",
    likesCount: 312,
    commentsCount: 1,
    isLiked: false,
    isSaved: false,
    location: "Almaty, Kazakhstan",
    tags: ["ui", "ux", "design"],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
];

const INITIAL_COMMENTS: Record<string, Comment[]> = {
  p1: [
    {
      id: "c1",
      postId: "p1",
      author: {
        id: "u2",
        username: "travel_world",
        fullName: "Travel World",
        avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100",
        isVerified: true,
      },
      text: "Отличная работа! Архитектура FSD просто огонь 🔥",
      likesCount: 12,
      isLiked: false,
      replies: [],
      repliesCount: 0,
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
      id: "c2",
      postId: "p1",
      author: {
        id: "u3",
        username: "sarah_design",
        fullName: "Sarah Designer",
        avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100",
        isVerified: false,
      },
      text: "Интерфейс выглядит очень чисто и быстро работает! 👏",
      likesCount: 5,
      isLiked: true,
      replies: [],
      repliesCount: 0,
      createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    },
    {
      id: "c3",
      postId: "p1",
      author: {
        id: "u4",
        username: "john_doe",
        fullName: "John Doe",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
        isVerified: false,
      },
      text: "Жду релиз на прод! 🚀",
      likesCount: 2,
      isLiked: false,
      replies: [],
      repliesCount: 0,
      createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    },
  ],
  p2: [
    {
      id: "c4",
      postId: "p2",
      author: {
        id: "u1",
        username: "alex_dev",
        fullName: "Alex",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100",
        isVerified: true,
      },
      text: "Невероятный вид! Какая высота? 🏔️",
      likesCount: 8,
      isLiked: false,
      replies: [],
      repliesCount: 0,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    },
    {
      id: "c5",
      postId: "p2",
      author: {
        id: "u2",
        username: "travel_world",
        fullName: "Travel World",
        avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100",
        isVerified: true,
      },
      text: "Более 3500 метров над уровнем моря! ⛰️",
      likesCount: 14,
      isLiked: true,
      replies: [],
      repliesCount: 0,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
  ],
  p3: [
    {
      id: "c6",
      postId: "p3",
      author: {
        id: "u1",
        username: "alex_dev",
        fullName: "Alex",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100",
        isVerified: true,
      },
      text: "Очень гармоничная палитра цветов 👍",
      likesCount: 3,
      isLiked: false,
      replies: [],
      repliesCount: 0,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    },
  ],
};

interface PostState {
  posts: Post[];
  comments: Record<string, Comment[]>;
  selectedPostId: string | null;
  savedPostIds: Set<string>;

  // Actions
  addPost: (newPostData: {
    imageUrl: string;
    caption: string;
    location?: string;
    filterClass?: string;
  }) => void;
  toggleLike: (postId: string) => void;
  toggleSave: (postId: string) => void;
  addComment: (postId: string, text: string) => void;
  toggleCommentLike: (commentId: string, postId: string) => void;
  openPostDetail: (postId: string) => void;
  closePostDetail: () => void;
  getUserPostsPreview: (username?: string) => PostPreview[];
  getSavedPostsPreview: () => PostPreview[];
}

export const usePostStore = create<PostState>((set, get) => ({
  posts: INITIAL_POSTS,
  comments: INITIAL_COMMENTS,
  selectedPostId: null,
  savedPostIds: new Set(["p2"]),

  addPost: ({ imageUrl, caption, location, filterClass }) => {
    const newPost: Post = {
      id: `post_${Date.now()}`,
      author: {
        id: "current_user",
        username: "kholid_official",
        fullName: "Kholid",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        isVerified: true,
      },
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

    set((state) => ({
      posts: [newPost, ...state.posts],
      comments: {
        ...state.comments,
        [newPost.id]: [],
      },
    }));
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
    set((state) => {
      const newSaved = new Set(state.savedPostIds);
      const isCurrentlySaved = newSaved.has(postId);

      if (isCurrentlySaved) {
        newSaved.delete(postId);
      } else {
        newSaved.add(postId);
      }

      return {
        savedPostIds: newSaved,
        posts: state.posts.map((post) =>
          post.id === postId ? { ...post, isSaved: !isCurrentlySaved } : post
        ),
      };
    });
  },

  addComment: (postId, text) => {
    if (!text.trim()) return;

    const newComment: Comment = {
      id: `comment_${Date.now()}`,
      postId,
      author: {
        id: "current_user",
        username: "kholid_official",
        fullName: "Kholid",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        isVerified: true,
      },
      text: text.trim(),
      likesCount: 0,
      isLiked: false,
      replies: [],
      repliesCount: 0,
      createdAt: new Date().toISOString(),
    };

    set((state) => {
      const currentComments = state.comments[postId] || [];
      return {
        comments: {
          ...state.comments,
          [postId]: [...currentComments, newComment],
        },
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p
        ),
      };
    });
  },

  toggleCommentLike: (commentId, postId) => {
    set((state) => {
      const currentComments = state.comments[postId] || [];
      return {
        comments: {
          ...state.comments,
          [postId]: currentComments.map((c) =>
            c.id === commentId
              ? {
                  ...c,
                  isLiked: !c.isLiked,
                  likesCount: c.isLiked ? c.likesCount - 1 : c.likesCount + 1,
                }
              : c
          ),
        },
      };
    });
  },

  openPostDetail: (postId) => set({ selectedPostId: postId }),
  closePostDetail: () => set({ selectedPostId: null }),

  getUserPostsPreview: () => {
    const posts = get().posts;
    return posts.map((p) => ({
      id: p.id,
      thumbnailUrl: p.images[0]?.url || "",
      likesCount: p.likesCount,
      commentsCount: p.commentsCount,
      isMultiple: p.images.length > 1,
      isVideo: false,
    }));
  },

  getSavedPostsPreview: () => {
    const { posts, savedPostIds } = get();
    return posts
      .filter((p) => savedPostIds.has(p.id))
      .map((p) => ({
        id: p.id,
        thumbnailUrl: p.images[0]?.url || "",
        likesCount: p.likesCount,
        commentsCount: p.commentsCount,
        isMultiple: p.images.length > 1,
        isVideo: false,
      }));
  },
}));
