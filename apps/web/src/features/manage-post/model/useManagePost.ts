"use client";

import type { Post, UserProfile } from "@ig/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "@/shared/i18n";
import { toast } from "@/shared/ui";
import { useSessionStore } from "@/entities/session";
import { patchPost, postApi, removePost } from "@/entities/post";
import { userKeys } from "@/entities/user";

/** The author's own actions on a post: delete, archive, hide likes, turn comments off */
export function useManagePost(post: Pick<Post, "id" | "hideLikes" | "commentsDisabled">) {
  const queryClient = useQueryClient();
  const t = useTranslations("post");

  /** The post leaves the profile: one post fewer in the header counter */
  const dropFromProfile = () => {
    removePost(queryClient, post.id);
    const { user, setUser } = useSessionStore.getState();
    if (!user) return;
    setUser({ ...user, postsCount: Math.max(0, user.postsCount - 1) });
    queryClient.setQueryData<UserProfile>(userKeys.profile(user.username), (profile) =>
      profile ? { ...profile, postsCount: Math.max(0, profile.postsCount - 1) } : profile
    );
  };

  const remove = useMutation({
    mutationFn: () => postApi.remove(post.id),
    onSuccess: () => {
      dropFromProfile();
      toast(t("deleted"));
    },
    onError: () => toast.error(t("error")),
  });

  const archive = useMutation({
    mutationFn: () => postApi.archive(post.id),
    onSuccess: () => {
      dropFromProfile();
      toast(t("archived"));
    },
    onError: () => toast.error(t("error")),
  });

  const settings = useMutation({
    mutationFn: (body: { hideLikes?: boolean; commentsDisabled?: boolean }) => postApi.update(post.id, body),
    onMutate: (body) => patchPost(queryClient, post.id, () => body),
    // The server hides or reveals the like count: take its version of the post
    onSuccess: (updated) =>
      patchPost(queryClient, post.id, () => ({
        likesCount: updated.likesCount,
        hideLikes: updated.hideLikes,
        commentsDisabled: updated.commentsDisabled,
      })),
    onError: (_error, body) => {
      patchPost(queryClient, post.id, () => ({
        ...(body.hideLikes !== undefined && { hideLikes: !body.hideLikes }),
        ...(body.commentsDisabled !== undefined && { commentsDisabled: !body.commentsDisabled }),
      }));
      toast.error(t("error"));
    },
  });

  return {
    remove: () => remove.mutate(),
    archive: () => archive.mutate(),
    toggleLikes: () => settings.mutate({ hideLikes: !post.hideLikes }),
    toggleComments: () => settings.mutate({ commentsDisabled: !post.commentsDisabled }),
    isRemoving: remove.isPending,
  };
}
