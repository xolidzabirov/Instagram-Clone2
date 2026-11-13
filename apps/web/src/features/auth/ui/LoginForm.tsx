"use client";

import { loginSchema } from "@ig/shared";
import { useState, type FormEvent } from "react";
import { toApiError } from "@/shared/api";
import { useTranslations } from "@/shared/i18n";
import { Button, Input, PasswordInput } from "@/shared/ui";
import { authErrorKey } from "../model/errors";
import { useLogin } from "../model/useAuthActions";

export function LoginForm() {
  const t = useTranslations();
  const login = useLogin();
  const [values, setValues] = useState({ login: "", password: "" });

  // Instagram keeps the button disabled until both fields could be valid
  const canSubmit = values.login.trim().length > 0 && values.password.length >= 6;
  const error = login.error ? t(`auth.errors.${authErrorKey(toApiError(login.error))}`) : null;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = loginSchema.safeParse(values);
    if (parsed.success) login.mutate(parsed.data);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex w-full flex-col gap-1.5">
      <Input
        label={t("auth.loginField")}
        name="username"
        autoComplete="username"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        value={values.login}
        onChange={(e) => setValues((v) => ({ ...v, login: e.target.value }))}
      />
      <PasswordInput
        label={t("auth.password")}
        name="password"
        autoComplete="current-password"
        showLabel={t("common.showPassword")}
        hideLabel={t("common.hidePassword")}
        value={values.password}
        onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
      />
      <Button type="submit" size="sm" fullWidth className="mt-2" disabled={!canSubmit} loading={login.isPending}>
        {t("auth.logIn")}
      </Button>
      {error && (
        <p role="alert" className="mt-3 text-center text-sm leading-[18px] text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
