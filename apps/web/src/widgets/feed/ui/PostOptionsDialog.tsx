"use client";

import type { FeedItem, Post } from "@ig/shared";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "@/shared/i18n";
import { Modal, ModalAction, toast } from "@/shared/ui";
import { useFollowUser } from "@/features/follow-user";
import { useManagePost } from "@/features/manage-post";
import { copyPostLink } from "@/features/share-post";

interface PostOptionsDialogProps {
  post: Post & Partial<Pick<FeedItem, "isSuggested">>;
  isOwn: boolean;
  onClose: () => void;
}

/** Instagram's "…" sheet: author tools on your own posts, report / unfollow on others' */
export function PostOptionsDialog({ post, isOwn, onClose }: PostOptionsDialogProps) {
  const t = useTranslations("post");
  const common = useTranslations("common");
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const manage = useManagePost(post);
  const { unfollow } = useFollowUser(
    { id: post.author.id, username: post.author.username, avatar: post.author.avatar },
    { following: true, followRequested: false }
  );

  const run = (action: () => void) => () => {
    action();
    onClose();
  };

  const copyLink = run(() =>
    copyPostLink(post.id).then(
      () => toast(t("linkCopied")),
      () => toast.error(t("error"))
    )
  );

  if (confirmDelete) {
    return (
      <Modal open onClose={onClose} size="sm" ariaLabel={t("deleteConfirm")}>
        <div className="flex flex-col items-center gap-2 px-8 pb-6 pt-8 text-center">
          <h2 className="text-xl">{t("deleteConfirm")}</h2>
          <p className="text-sm text-muted">{t("deleteText")}</p>
        </div>
        <ModalAction tone="danger" onClick={run(manage.remove)}>
          {t("delete")}
        </ModalAction>
        <ModalAction onClick={onClose}>{common("cancel")}</ModalAction>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} size="sm" ariaLabel={t("options")}>
      {isOwn ? (
        <>
          <ModalAction tone="danger" onClick={() => setConfirmDelete(true)}>
            {t("delete")}
          </ModalAction>
          <ModalAction onClick={run(manage.archive)}>{t("archive")}</ModalAction>
          <ModalAction onClick={run(manage.toggleLikes)}>{post.hideLikes ? t("showLikes") : t("hideLikes")}</ModalAction>
          <ModalAction onClick={run(manage.toggleComments)}>
            {post.commentsDisabled ? t("enableComments") : t("disableComments")}
          </ModalAction>
        </>
      ) : (
        <>
          <ModalAction tone="danger" onClick={run(() => toast(t("reported")))}>
            {t("report")}
          </ModalAction>
          {!post.isSuggested && (
            <ModalAction tone="danger" onClick={run(unfollow)}>
              {t("unfollow")}
            </ModalAction>
          )}
        </>
      )}
      <ModalAction onClick={run(() => router.push(`/p/${post.id}`))}>{t("goToPost")}</ModalAction>
      <ModalAction onClick={copyLink}>{t("copyLink")}</ModalAction>
      <ModalAction onClick={onClose}>{common("cancel")}</ModalAction>
    </Modal>
  );
}
