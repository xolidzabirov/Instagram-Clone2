"use client";

import { useTranslations } from "@/shared/i18n";
import { ShareIcon, toast } from "@/shared/ui";

export async function copyPostLink(postId: string) {
  await navigator.clipboard.writeText(`${window.location.origin}/p/${postId}`);
}

/** Paper plane: copies the post link for now; sending to Direct chats arrives with Direct (FE-14) */
export function ShareButton({ postId }: { postId: string }) {
  const t = useTranslations("post");

  return (
    <button
      type="button"
      aria-label={t("share")}
      onClick={() =>
        copyPostLink(postId).then(
          () => toast(t("linkCopied")),
          () => toast.error(t("error"))
        )
      }
      className="p-2 transition-opacity hover:opacity-60"
    >
      <ShareIcon className="size-6" />
    </button>
  );
}
