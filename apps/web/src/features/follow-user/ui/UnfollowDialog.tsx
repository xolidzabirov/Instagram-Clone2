"use client";

import { useTranslations } from "@/shared/i18n";
import { Avatar, Modal, ModalAction } from "@/shared/ui";
import type { FollowTarget } from "../model/useFollowUser";

interface UnfollowDialogProps {
  target: FollowTarget;
  /** True when cancelling a pending request rather than an accepted follow */
  requested: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** Instagram's confirmation: avatar, "Unfollow @name?", a red action and Cancel */
export function UnfollowDialog({ target, requested, onConfirm, onClose }: UnfollowDialogProps) {
  const t = useTranslations("follow");
  const common = useTranslations("common");
  const question = t("unfollowConfirm", { username: target.username });

  return (
    <Modal open onClose={onClose} ariaLabel={question} size="sm">
      <div className="flex flex-col items-center gap-4 px-8 pb-6 pt-8 text-center">
        <Avatar src={target.avatar} alt="" size="xl" />
        <p className="text-sm">{target.isPrivate || requested ? t("unfollowPrivate", { username: target.username }) : question}</p>
      </div>
      <ModalAction
        tone="danger"
        className="border-t"
        onClick={() => {
          onConfirm();
          onClose();
        }}
      >
        {requested ? t("cancelRequest") : t("unfollow")}
      </ModalAction>
      <ModalAction onClick={onClose}>{common("cancel")}</ModalAction>
    </Modal>
  );
}
