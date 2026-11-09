import type { ReactNode } from "react";
import Image from "next/image";
import type { Comment } from "@ig/shared";
import { DEFAULT_AVATAR } from "@/shared/config";

interface CommentItemProps {
  comment: Comment;
  /** Like button, provided by the like-comment feature */
  likeSlot?: ReactNode;
}

export function CommentItem({ comment, likeSlot }: CommentItemProps) {
  return (
    <div className="flex items-start justify-between gap-2 group">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full overflow-hidden relative flex-shrink-0">
          <Image
            src={comment.author.avatar ?? DEFAULT_AVATAR}
            unoptimized={!comment.author.avatar}
            alt={comment.author.username}
            fill
            className="object-cover"
          />
        </div>
        <div className="text-sm">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100 mr-2">
            {comment.author.username}
          </span>
          <span className="text-zinc-800 dark:text-zinc-200">{comment.text}</span>
          <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-1">
            <span>
              {new Date(comment.createdAt).toLocaleTimeString("ru-RU", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {comment.likesCount > 0 && <span>Нравится: {comment.likesCount}</span>}
            <button className="hover:text-zinc-600 font-semibold">Ответить</button>
          </div>
        </div>
      </div>

      {likeSlot}
    </div>
  );
}
