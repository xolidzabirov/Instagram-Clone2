"use client";

import { FiBookmark } from "react-icons/fi";
import { usePostStore } from "@/entities/post";

interface SaveButtonProps {
  postId: string;
  isSaved: boolean;
}

export function SaveButton({ postId, isSaved }: SaveButtonProps) {
  const toggleSave = usePostStore((s) => s.toggleSave);

  return (
    <button
      onClick={() => toggleSave(postId)}
      aria-label={isSaved ? "Unsave" : "Save"}
      className="hover:opacity-70 transition-transform active:scale-125"
    >
      <FiBookmark
        className={`w-6 h-6 ${
          isSaved
            ? "fill-zinc-900 dark:fill-zinc-100 text-zinc-900 dark:text-zinc-100"
            : "text-zinc-900 dark:text-zinc-100"
        }`}
      />
    </button>
  );
}
