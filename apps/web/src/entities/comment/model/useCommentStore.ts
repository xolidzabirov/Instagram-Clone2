"use client";

import { create } from "zustand";
import type { Comment, UserPreview } from "@ig/shared";
import { mockCommentsByPost } from "./mocks";

interface CommentState {
  commentsByPost: Record<string, Comment[]>;
  addComment: (postId: string, text: string, author: UserPreview) => void;
  toggleCommentLike: (commentId: string, postId: string) => void;
}

export const useCommentStore = create<CommentState>((set) => ({
  commentsByPost: mockCommentsByPost,

  addComment: (postId, text, author) => {
    const newComment: Comment = {
      id: `comment_${Date.now()}`,
      postId,
      author,
      text: text.trim(),
      likesCount: 0,
      isLiked: false,
      replies: [],
      repliesCount: 0,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      commentsByPost: {
        ...state.commentsByPost,
        [postId]: [...(state.commentsByPost[postId] || []), newComment],
      },
    }));
  },

  toggleCommentLike: (commentId, postId) => {
    set((state) => ({
      commentsByPost: {
        ...state.commentsByPost,
        [postId]: (state.commentsByPost[postId] || []).map((c) =>
          c.id === commentId
            ? {
                ...c,
                isLiked: !c.isLiked,
                likesCount: c.isLiked ? c.likesCount - 1 : c.likesCount + 1,
              }
            : c
        ),
      },
    }));
  },
}));
