"use client";

import type { Post } from "@ig/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "@/shared/i18n";
import { BookmarkIcon, toast } from "@/shared/ui";
import { patchPost, postApi, postKeys } from "@/entities/post";

/** Bookmark: saves into "All posts" instantly; the Saved tab refetches next time it is opened */
export function SaveButton({ post }: { post: Pick<Post, "id" | "isSaved"> }) {
  const t = useTranslations("post");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (saved: boolean) => postApi.save(post.id, saved),
    onMutate: (saved) => patchPost(queryClient, post.id, () => ({ isSaved: saved })),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...postKeys.allGrids()], predicate: (query) => query.queryKey[3] === "saved" });
    },
    onError: (_error, saved) => {
      patchPost(queryClient, post.id, () => ({ isSaved: !saved }));
      toast.error(t("error"));
    },
  });

  return (
    <button
      type="button"
      aria-label={post.isSaved ? t("unsave") : t("save")}
      aria-pressed={post.isSaved}
      onClick={() => mutation.mutate(!post.isSaved)}
      className="p-2 transition-opacity hover:opacity-60"
    >
      <BookmarkIcon filled={post.isSaved} className="size-6" />
    </button>
  );
}
