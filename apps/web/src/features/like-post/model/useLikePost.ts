"use client";

import type { Post } from "@ig/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "@/shared/i18n";
import { toast } from "@/shared/ui";
import { patchPost, patchPreview, postApi } from "@/entities/post";

/** Like / unlike with an instant heart and counter; rolls back with a toast if the API refuses */
export function useLikePost(post: Pick<Post, "id" | "isLiked">) {
  const queryClient = useQueryClient();
  const t = useTranslations("post");

  const mutation = useMutation({
    mutationFn: (liked: boolean) => postApi.like(post.id, liked),
    onMutate: (liked) => {
      patchPost(queryClient, post.id, (current) => ({
        isLiked: liked,
        likesCount: current.likesCount === null ? null : Math.max(0, current.likesCount + (liked ? 1 : -1)),
      }));
    },
    onSuccess: (result) => {
      patchPost(queryClient, post.id, () => ({ isLiked: result.liked, likesCount: result.likesCount }));
      if (result.likesCount !== null) patchPreview(queryClient, post.id, { likesCount: result.likesCount });
    },
    onError: (_error, liked) => {
      patchPost(queryClient, post.id, (current) => ({
        isLiked: !liked,
        likesCount: current.likesCount === null ? null : Math.max(0, current.likesCount + (liked ? -1 : 1)),
      }));
      toast.error(t("error"));
    },
  });

  return {
    toggle: () => mutation.mutate(!post.isLiked),
    /** Double tap only ever likes, it never unlikes */
    like: () => {
      if (!post.isLiked) mutation.mutate(true);
    },
  };
}
