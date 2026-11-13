"use client";

import { useTranslations } from "@/shared/i18n";
import { useSession } from "@/entities/session";
import { EditProfileForm } from "@/features/edit-profile";

/** `/accounts/edit` */
export function EditProfilePage() {
  const t = useTranslations("editProfile");
  const user = useSession();

  return (
    <div className="w-full max-w-[706px] px-4 pb-16 pt-6 md:px-0 md:pt-12">
      <h1 className="mb-6 text-xl font-bold md:mb-11">{t("title")}</h1>
      {/* Remount when the user changes (e.g. after renaming) so the form starts from fresh values */}
      {user && <EditProfileForm key={user.id} user={user} />}
    </div>
  );
}
