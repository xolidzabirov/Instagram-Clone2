"use client";

import Link from "next/link";
import { ROUTES } from "@/shared/config";
import { useTranslations } from "@/shared/i18n";
import { LockIcon } from "@/shared/ui";
import { ResetPasswordForm } from "@/features/auth";
import { AuthCard, AuthDivider, AuthFooter } from "@/widgets/auth-shell";

export function ResetPasswordPage() {
  const t = useTranslations("auth");

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <main className="flex flex-1 justify-center pt-8 sm:pt-16">
        <div className="flex w-full max-w-[388px] flex-col">
          <AuthCard className="flex flex-col items-center px-11 pt-6">
            <div className="mb-4 mt-2 flex size-24 items-center justify-center rounded-full border-[3px] border-foreground">
              <LockIcon className="size-12" />
            </div>
            <h1 className="mb-3 text-base font-semibold">{t("troubleTitle")}</h1>
            <p className="mb-4 text-center text-sm text-muted">{t("troubleText")}</p>
            <ResetPasswordForm />
            <AuthDivider />
            <Link href={ROUTES.register} className="mb-16 text-sm font-semibold text-foreground hover:opacity-60">
              {t("createAccount")}
            </Link>
          </AuthCard>
          <Link
            href={ROUTES.login}
            className="flex h-11 items-center justify-center border border-separator bg-surface text-sm font-semibold text-foreground hover:opacity-70 sm:border-t-0"
          >
            {t("backToLogin")}
          </Link>
        </div>
      </main>
      <AuthFooter />
    </div>
  );
}
