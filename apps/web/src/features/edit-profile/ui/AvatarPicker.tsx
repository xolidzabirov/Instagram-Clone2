"use client";

import { ALLOWED_MIME_TYPES } from "@ig/shared";
import { useId, useState, type ReactNode } from "react";
import { useTranslations } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { Modal, ModalAction, Spinner } from "@/shared/ui";
import { useChangeAvatar } from "../model/useChangeAvatar";

interface AvatarPickerProps {
  hasAvatar: boolean;
  /** What to click: the avatar itself, or a "Change photo" button */
  children: (props: { onClick: () => void; disabled: boolean }) => ReactNode;
  className?: string;
}

/**
 * Instagram's flow: without a photo the file picker opens straight away; with one, a dialog
 * offers "Upload photo" / "Remove current photo". A spinner covers the trigger while uploading.
 */
export function AvatarPicker({ hasAvatar, children, className }: AvatarPickerProps) {
  const t = useTranslations("editProfile");
  const common = useTranslations("common");
  const inputId = useId();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { upload, remove, isPending } = useChangeAvatar();

  const pickFile = () => {
    setDialogOpen(false);
    // Looked up on click (not a ref): the trigger is rendered through a render prop
    (document.getElementById(inputId) as HTMLInputElement | null)?.click();
  };

  return (
    <div className={cn("relative", className)}>
      {children({ onClick: hasAvatar ? () => setDialogOpen(true) : pickFile, disabled: isPending })}
      {isPending && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-background/60">
          <Spinner />
          <span className="sr-only">{t("uploading")}</span>
        </div>
      )}
      <input
        id={inputId}
        type="file"
        accept={ALLOWED_MIME_TYPES.IMAGE.join(",")}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) upload(file);
          event.target.value = "";
        }}
      />
      {dialogOpen && (
        <Modal open onClose={() => setDialogOpen(false)} size="sm" ariaLabel={t("changePhoto")}>
          <h2 className="px-8 pb-6 pt-7 text-center text-xl">{t("changePhoto")}</h2>
          <ModalAction tone="primary" className="border-t" onClick={pickFile}>
            {t("uploadPhoto")}
          </ModalAction>
          <ModalAction
            tone="danger"
            onClick={() => {
              setDialogOpen(false);
              remove();
            }}
          >
            {t("removePhoto")}
          </ModalAction>
          <ModalAction onClick={() => setDialogOpen(false)}>{common("cancel")}</ModalAction>
        </Modal>
      )}
    </div>
  );
}
