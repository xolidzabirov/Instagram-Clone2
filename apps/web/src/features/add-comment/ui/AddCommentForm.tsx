"use client";

import { useState } from "react";
import { FiSmile } from "react-icons/fi";
import { useCommentStore } from "@/entities/comment";
import { usePostStore } from "@/entities/post";
import { mockCurrentUser } from "@/entities/user";

const QUICK_EMOJIS = ["❤️", "🔥", "👏", "😍", "🙌", "✨"];

interface AddCommentFormProps {
  postId: string;
}

export function AddCommentForm({ postId }: AddCommentFormProps) {
  const addComment = useCommentStore((s) => s.addComment);
  const incrementCommentsCount = usePostStore((s) => s.incrementCommentsCount);
  const [commentInput, setCommentInput] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    addComment(postId, commentInput, mockCurrentUser);
    incrementCommentsCount(postId);
    setCommentInput("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-zinc-200 dark:border-zinc-800 p-3 flex flex-col gap-2 bg-white dark:bg-black"
    >
      {/* Quick emoji row */}
      <div className="flex items-center gap-2 text-base px-1">
        {QUICK_EMOJIS.map((emoji) => (
          <button
            type="button"
            key={emoji}
            onClick={() => setCommentInput((prev) => prev + emoji)}
            className="hover:scale-125 transition-transform"
          >
            {emoji}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <FiSmile className="w-5 h-5 text-zinc-400 flex-shrink-0" />
        <input
          type="text"
          value={commentInput}
          onChange={(e) => setCommentInput(e.target.value)}
          placeholder="Добавьте комментарий..."
          className="w-full text-sm bg-transparent outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
        />
        <button
          type="submit"
          disabled={!commentInput.trim()}
          className="text-sm font-semibold text-blue-500 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-blue-500"
        >
          Опубликовать
        </button>
      </div>
    </form>
  );
}
