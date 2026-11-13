"use client";

import type { Relationship } from "@ig/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "@/shared/i18n";
import { toast } from "@/shared/ui";
import { patchRelationship } from "@/entities/user";
import { followApi } from "../api/followApi";

type Toggle = "isCloseFriend" | "isFavorite" | "mutedPosts" | "mutedStories";

/** Close friends, Favorites and Mute: flip a flag optimistically, roll back if the API refuses */
export function useRelationshipToggles(target: { id: string; username: string }) {
  const queryClient = useQueryClient();
  const t = useTranslations("follow");

  const mutation = useMutation({
    mutationFn: ({ key, value }: { key: Toggle; value: boolean }) =>
      key === "isCloseFriend"
        ? followApi.setCloseFriend(target.id, value)
        : followApi.updateRelationship(target.id, { [key]: value }),
    onMutate: ({ key, value }) => patchRelationship(queryClient, target.username, { [key]: value } as Partial<Relationship>),
    onError: (_error, { key, value }) => {
      patchRelationship(queryClient, target.username, { [key]: !value } as Partial<Relationship>);
      toast.error(t("error"));
    },
  });

  return (key: Toggle, value: boolean) => mutation.mutate({ key, value });
}
