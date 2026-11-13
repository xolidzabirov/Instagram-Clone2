"use client";

import type { Post } from "@ig/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/shared/api";
import { useTranslations } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { RepostIcon, toast } from "@/shared/ui";
import { patchPost, postApi, postKeys } from "@/entities/post";

/** Instagram's 2025 repost: shares someone's post to your profile's Reposts tab */
export function RepostButton({ post }: { post: Pick<Post, "id" | "isReposted"> }) {
  const t = useTranslations("post");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (reposted: boolean) => postApi.repost(post.id, reposted),
    onMutate: (reposted) => patchPost(queryClient, post.id, () => ({ isReposted: reposted })),
    onSuccess: (_data, reposted) => {
      toast(reposted ? t("reposted") : t("repostRemoved"));
      void queryClient.invalidateQueries({ queryKey: postKeys.allGrids() });
    },
    onError: (error, reposted) => {
      patchPost(queryClient, post.id, () => ({ isReposted: !reposted }));
      toast.error(error instanceof ApiError && error.code === "CANNOT_REPOST_PRIVATE" ? t("privateRepost") : t("error"));
    },
  });

  return (
    <button
      type="button"
      aria-label={post.isReposted ? t("undoRepost") : t("repost")}
      aria-pressed={post.isReposted}
      onClick={() => mutation.mutate(!post.isReposted)}
      className={cn("p-2 transition-opacity hover:opacity-60", post.isReposted && "text-success")}
    >
      <RepostIcon filled={post.isReposted} className="size-6" />
    </button>
  );
}
