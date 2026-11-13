"use client";

import type { CurrentUser, UserProfile } from "@ig/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadMedia } from "@/shared/api";
import { useTranslations } from "@/shared/i18n";
import { toast } from "@/shared/ui";
import { useSessionStore } from "@/entities/session";
import { userApi, userKeys } from "@/entities/user";

/** Upload a new profile photo or remove the current one; the header and sidebar update at once */
export function useChangeAvatar() {
  const queryClient = useQueryClient();
  const t = useTranslations("editProfile");

  const apply = (user: CurrentUser) => {
    useSessionStore.getState().setUser(user);
    queryClient.setQueryData<UserProfile>(userKeys.profile(user.username), (profile) =>
      profile ? { ...profile, avatar: user.avatar } : profile
    );
  };

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const media = await uploadMedia(file, "AVATAR");
      return userApi.setAvatar(media.id);
    },
    onSuccess: (user) => {
      apply(user);
      toast(t("photoUpdated"));
    },
    onError: () => toast.error(t("photoFailed")),
  });

  const remove = useMutation({
    mutationFn: userApi.removeAvatar,
    onSuccess: (user) => {
      apply(user);
      toast(t("photoRemoved"));
    },
    onError: () => toast.error(t("photoFailed")),
  });

  return {
    upload: (file: File) => upload.mutate(file),
    remove: () => remove.mutate(),
    isPending: upload.isPending || remove.isPending,
  };
}
