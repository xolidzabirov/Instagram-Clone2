"use client";

import type { UserPreview, UserProfile } from "@ig/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslations } from "@/shared/i18n";
import { Avatar, Button, Modal, ModalAction, toast } from "@/shared/ui";
import { useSessionStore } from "@/entities/session";
import { removeFromFollowLists, userKeys } from "@/entities/user";
import { blockApi } from "../api/blockApi";

/** "Remove" next to a follower in your own followers list, with Instagram's confirmation */
export function RemoveFollowerButton({ user }: { user: UserPreview }) {
  const t = useTranslations("follow");
  const common = useTranslations("common");
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const remove = useMutation({
    mutationFn: () => blockApi.removeFollower(user.id),
    onSuccess: () => {
      removeFromFollowLists(queryClient, user.id);
      const { user: me, setUser } = useSessionStore.getState();
      if (!me) return;
      setUser({ ...me, followersCount: Math.max(0, me.followersCount - 1) });
      queryClient.setQueryData<UserProfile>(userKeys.profile(me.username), (profile) =>
        profile ? { ...profile, followersCount: Math.max(0, profile.followersCount - 1) } : profile
      );
    },
    onError: () => toast.error(t("error")),
  });

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        {t("remove")}
      </Button>
      {open && (
        <Modal open onClose={() => setOpen(false)} ariaLabel={t("removeFollower")} size="sm">
          <div className="flex flex-col items-center gap-3 px-8 pb-6 pt-8 text-center">
            <Avatar src={user.avatar} alt="" size="xl" />
            <h2 className="text-xl">{t("removeFollower")}</h2>
            <p className="text-sm text-muted">{t("removeFollowerText", { username: user.username })}</p>
          </div>
          <ModalAction
            tone="danger"
            onClick={() => {
              remove.mutate();
              setOpen(false);
            }}
          >
            {t("remove")}
          </ModalAction>
          <ModalAction onClick={() => setOpen(false)}>{common("cancel")}</ModalAction>
        </Modal>
      )}
    </>
  );
}
