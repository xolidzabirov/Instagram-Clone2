"use client";

import Link from "next/link";
import { ROUTES } from "@/shared/config";
import { useTranslations } from "@/shared/i18n";
import { Logo } from "@/shared/ui";
import { LoginForm } from "@/features/auth";
import { AuthCard, AuthDivider, AuthFooter, PhoneShowcase } from "@/widgets/auth-shell";

export function LoginPage() {
  const t = useTranslations("auth");

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <main className="flex flex-1 items-center justify-center pt-8 sm:pt-12">
        <PhoneShowcase />
        <div className="flex w-full max-w-[350px] flex-col gap-2.5">
          <AuthCard className="flex flex-col items-center px-10 pb-6 pt-10">
            <h1 className="mb-8 mt-2">
              <Logo className="text-[46px]" />
              <span className="sr-only">{t("loginTitle")}</span>
            </h1>
            <LoginForm />
            <AuthDivider />
            <Link
              href={ROUTES.resetPassword}
              className="text-sm text-foreground hover:underline focus-visible:underline focus-visible:outline-none"
            >
              {t("forgotPassword")}
            </Link>
          </AuthCard>
          <AuthCard className="py-5 text-center text-sm">
            {t("noAccount")}{" "}
            <Link href={ROUTES.register} className="font-semibold text-primary hover:text-link">
              {t("signUp")}
            </Link>
          </AuthCard>
        </div>
      </main>
      <AuthFooter />
    </div>
  );
}
