"use client";

import { forgotPasswordSchema, resetPasswordSchema } from "@ig/shared";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toApiError } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import { useTranslations } from "@/shared/i18n";
import { Button, Input, PasswordInput, toast } from "@/shared/ui";
import { authApi } from "../api/authApi";
import { authErrorKey } from "../model/errors";

/** Two steps: request a code by email, then enter the code with a new password */
export function ResetPasswordForm() {
  const t = useTranslations();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);

  const requestCode = useMutation({
    mutationFn: (value: string) => authApi.forgotPassword({ email: value }),
    onSuccess: (_, value) => setSentTo(value),
  });
  const reset = useMutation({
    mutationFn: authApi.resetPassword,
    onSuccess: () => {
      toast(t("auth.passwordChanged"));
      router.replace(ROUTES.login);
    },
  });

  const error = requestCode.error ?? reset.error;
  const message = error ? t(`auth.errors.${authErrorKey(toApiError(error))}`) : null;

  if (!sentTo) {
    const parsedEmail = forgotPasswordSchema.safeParse({ email });
    const submit = (event: FormEvent) => {
      event.preventDefault();
      if (parsedEmail.success) requestCode.mutate(parsedEmail.data.email);
    };
    return (
      <form onSubmit={submit} noValidate className="flex w-full flex-col gap-3">
        <Input label={t("auth.email")} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button type="submit" size="sm" fullWidth disabled={!parsedEmail.success} loading={requestCode.isPending}>
          {t("auth.sendCode")}
        </Button>
        {message && <p role="alert" className="text-center text-sm text-danger">{message}</p>}
      </form>
    );
  }

  const parsed = resetPasswordSchema.safeParse({ email: sentTo, code, newPassword });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (parsed.success) reset.mutate(parsed.data);
  };
  const codeInvalid = code.length > 0 && !/^\d{6}$/.test(code);
  const passwordInvalid = newPassword.length > 0 && !parsed.success && parsed.error.issues.some((i) => i.path[0] === "newPassword");

  return (
    <form onSubmit={submit} noValidate className="flex w-full flex-col gap-3">
      <p className="text-center text-sm text-muted">{t("auth.codeSentTo", { email: sentTo })}</p>
      <Input
        label={t("auth.code")}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        error={codeInvalid ? t("auth.fieldErrors.code") : undefined}
      />
      <PasswordInput
        label={t("auth.newPassword")}
        autoComplete="new-password"
        showLabel={t("common.showPassword")}
        hideLabel={t("common.hidePassword")}
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        error={passwordInvalid ? t("auth.fieldErrors.password") : undefined}
      />
      <Button type="submit" size="sm" fullWidth disabled={!parsed.success} loading={reset.isPending}>
        {t("auth.resetPassword")}
      </Button>
      {message && <p role="alert" className="text-center text-sm text-danger">{message}</p>}
    </form>
  );
}
