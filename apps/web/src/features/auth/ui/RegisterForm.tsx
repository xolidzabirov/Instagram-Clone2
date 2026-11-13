"use client";

import { registerRequestSchema } from "@ig/shared";
import { useState, type FormEvent } from "react";
import { toApiError } from "@/shared/api";
import { useTranslations } from "@/shared/i18n";
import { Button, CheckIcon, FieldErrorIcon, Input, PasswordInput, Spinner } from "@/shared/ui";
import { authErrorKey } from "../model/errors";
import { useRegister } from "../model/useAuthActions";
import { useUsernameCheck } from "../model/useUsernameCheck";

type Field = "email" | "password" | "fullName" | "username";
const FIELDS: Field[] = ["email", "password", "fullName", "username"];

export function RegisterForm() {
  const t = useTranslations();
  const register = useRegister();
  const [values, setValues] = useState<Record<Field, string>>({ email: "", password: "", fullName: "", username: "" });
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const usernameCheck = useUsernameCheck(values.username);

  // Client-side validation with the same schema the API uses
  const parsed = registerRequestSchema.safeParse(values);
  const invalid = new Set<Field>(parsed.success ? [] : parsed.error.issues.map((issue) => issue.path[0] as Field));
  const showError = (field: Field) => (touched[field] || submitted) && values[field] !== "" && invalid.has(field);

  const apiError = register.error ? toApiError(register.error) : null;
  const usernameTaken = usernameCheck.result?.available === false && usernameCheck.result.reason === "TAKEN";

  const errorFor = (field: Field): string | undefined => {
    if (field === "username" && usernameTaken) {
      const suggestions = usernameCheck.result?.suggestions ?? [];
      return suggestions.length > 0
        ? `${t("auth.usernameTaken")} ${t("auth.usernameSuggestions", { list: suggestions.join(", ") })}`
        : t("auth.usernameTaken");
    }
    if (apiError?.code === "EMAIL_TAKEN" && field === "email") return t("auth.errors.emailTaken");
    if (apiError?.code === "USERNAME_TAKEN" && field === "username") return t("auth.errors.usernameTaken");
    return showError(field) ? t(`auth.fieldErrors.${field}`) : undefined;
  };

  /** Instagram marks each filled field with a red cross or a grey check once you leave it */
  const statusIcon = (field: Field) => {
    if (field === "username" && values.username && usernameCheck.checking) return <Spinner size="sm" className="text-muted" />;
    if (!values[field] || !(touched[field] || submitted)) return null;
    return errorFor(field) ? (
      <FieldErrorIcon className="size-[22px] text-danger" />
    ) : (
      <CheckIcon className="size-[22px] text-muted" />
    );
  };

  const formError =
    apiError && apiError.code !== "EMAIL_TAKEN" && apiError.code !== "USERNAME_TAKEN" && apiError.code !== "VALIDATION_ERROR"
      ? t(`auth.errors.${authErrorKey(apiError)}`)
      : null;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (parsed.success && !usernameTaken) register.mutate(parsed.data);
  };

  const field = (name: Field, label: string, props: Record<string, unknown>) => {
    const common = {
      label,
      name,
      value: values[name],
      error: errorFor(name),
      onChange: (e: { target: { value: string } }) => {
        setValues((v) => ({ ...v, [name]: e.target.value }));
        if (register.error) register.reset();
      },
      onBlur: () => setTouched((v) => ({ ...v, [name]: true })),
      ...props,
    };
    return name === "password" ? (
      <PasswordInput key={name} {...common} showLabel={t("common.showPassword")} hideLabel={t("common.hidePassword")} />
    ) : (
      <Input key={name} {...common} rightSlot={statusIcon(name)} />
    );
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex w-full flex-col gap-1.5">
      {field("email", t("auth.email"), { type: "email", autoComplete: "email", autoCapitalize: "off", spellCheck: false })}
      {field("password", t("auth.password"), { autoComplete: "new-password" })}
      {field("fullName", t("auth.fullName"), { autoComplete: "name" })}
      {field("username", t("auth.username"), { autoComplete: "username", autoCapitalize: "off", spellCheck: false })}

      <p className="mt-2.5 text-center text-xs leading-4 text-muted">{t("auth.contactsNote")}</p>
      <p className="mt-2 text-center text-xs leading-4 text-muted">{t("auth.termsNote")}</p>

      <Button
        type="submit"
        size="sm"
        fullWidth
        className="mt-3"
        disabled={FIELDS.some((name) => !values[name])}
        loading={register.isPending}
      >
        {t("auth.signUpButton")}
      </Button>
      {formError && (
        <p role="alert" className="mt-3 text-center text-sm text-danger">
          {formError}
        </p>
      )}
    </form>
  );
}
