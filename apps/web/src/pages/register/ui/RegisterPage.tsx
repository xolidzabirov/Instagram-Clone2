"use client";

import Link from "next/link";
import { ROUTES } from "@/shared/config";
import { useTranslations } from "@/shared/i18n";
import { Logo } from "@/shared/ui";
import { RegisterForm } from "@/features/auth";
import { AuthCard, AuthFooter } from "@/widgets/auth-shell";

export function RegisterPage() {
  const t = useTranslations("auth");

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <main className="flex flex-1 justify-center pt-3 sm:pt-6">
        <div className="flex w-full max-w-[350px] flex-col gap-2.5">
          <AuthCard className="flex flex-col items-center px-10 pb-7 pt-9">
            <h1 className="mb-3 mt-1 flex flex-col items-center gap-4">
              <Logo className="text-[46px]" />
              <span className="sr-only">{t("registerTitle")}</span>
            </h1>
            <p className="mb-5 text-center text-[17px] font-semibold leading-5 text-muted">{t("registerTagline")}</p>
            <RegisterForm />
          </AuthCard>
          <AuthCard className="py-5 text-center text-sm">
            {t("haveAccount")}{" "}
            <Link href={ROUTES.login} className="font-semibold text-primary hover:text-link">
              {t("logIn")}
            </Link>
          </AuthCard>
        </div>
      </main>
      <AuthFooter />
    </div>
  );
}
