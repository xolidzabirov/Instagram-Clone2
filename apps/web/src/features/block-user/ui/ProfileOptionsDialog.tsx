"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslations } from "@/shared/i18n";
import { Modal, ModalAction, toast } from "@/shared/ui";
import { userKeys } from "@/entities/user";
import { blockApi } from "../api/blockApi";

interface ProfileOptionsDialogProps {
  target: { id: string; username: string };
  blocking: boolean;
  /** Open straight on the block / unblock confirmation (the "Unblock" button on a blocked profile) */
  confirmOnly?: boolean;
  onClose: () => void;
}

/** The "…" menu on someone else's profile: block, restrict, report, copy link */
export function ProfileOptionsDialog({ target, blocking, confirmOnly = false, onClose }: ProfileOptionsDialogProps) {
  const t = useTranslations("relationship");
  const follow = useTranslations("follow");
  const common = useTranslations("common");
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(confirmOnly);

  // Blocking changes almost everything (follows both ways, feed, search): refetch rather than patch
  const block = useMutation({
    mutationFn: () => (blocking ? blockApi.unblock(target.id) : blockApi.block(target.id)),
    onSuccess: () => {
      toast(t(blocking ? "unblocked" : "blocked", { username: target.username }));
      void queryClient.invalidateQueries({ queryKey: userKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["posts"] });
      void queryClient.invalidateQueries({ queryKey: ["feed"] });
      onClose();
    },
    onError: () => toast.error(follow("error")),
  });

  const restrict = useMutation({
    mutationFn: () => blockApi.restrict(target.id),
    onSuccess: () => {
      toast(t("restricted", { username: target.username }));
      onClose();
    },
    onError: () => toast.error(follow("error")),
  });

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/${target.username}`);
      toast(t("linkCopied"));
    } catch {
      toast.error(follow("error"));
    }
    onClose();
  };

  if (confirming) {
    return (
      <Modal open onClose={onClose} ariaLabel={t(blocking ? "unblockConfirm" : "blockConfirm", { username: target.username })} size="sm">
        <div className="flex flex-col items-center gap-2 px-8 pb-6 pt-8 text-center">
          <h2 className="text-xl">{t(blocking ? "unblockConfirm" : "blockConfirm", { username: target.username })}</h2>
          <p className="text-sm text-muted">{t(blocking ? "unblockText" : "blockText")}</p>
        </div>
        <ModalAction tone={blocking ? "primary" : "danger"} disabled={block.isPending} onClick={() => block.mutate()}>
          {t(blocking ? "unblock" : "block")}
        </ModalAction>
        <ModalAction onClick={onClose}>{common("cancel")}</ModalAction>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} ariaLabel={target.username} size="sm">
      <ModalAction tone="danger" onClick={() => setConfirming(true)}>
        {t(blocking ? "unblock" : "block")}
      </ModalAction>
      {!blocking && (
        <ModalAction tone="danger" disabled={restrict.isPending} onClick={() => restrict.mutate()}>
          {follow("restrict")}
        </ModalAction>
      )}
      <ModalAction
        tone="danger"
        onClick={() => {
          toast(t("reported"));
          onClose();
        }}
      >
        {t("report")}
      </ModalAction>
      <ModalAction onClick={copyLink}>{t("copyLink")}</ModalAction>
      <ModalAction onClick={onClose}>{common("cancel")}</ModalAction>
    </Modal>
  );
}
