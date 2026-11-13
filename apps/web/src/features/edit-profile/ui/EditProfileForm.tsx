"use client";

import { profileLinkSchema, updateProfileSchema, type CurrentUser, type UpdateProfileInput } from "@ig/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { ApiError } from "@/shared/api";
import { useTranslations } from "@/shared/i18n";
import { Avatar, Button, Input, Textarea, toast } from "@/shared/ui";
import { useSessionStore } from "@/entities/session";
import { userApi, userKeys } from "@/entities/user";
import { AvatarPicker } from "./AvatarPicker";

const BIO_MAX = 150;

interface FormState {
  fullName: string;
  username: string;
  website: string;
  bio: string;
  isPrivate: boolean;
}

const fromUser = (user: CurrentUser): FormState => ({
  fullName: user.fullName,
  username: user.username,
  website: user.links[0]?.url ?? "",
  bio: user.bio,
  isPrivate: user.isPrivate,
});

/** Builds a PATCH body with only the fields that changed */
function diff(user: CurrentUser, form: FormState): UpdateProfileInput {
  const body: UpdateProfileInput = {};
  if (form.fullName.trim() !== user.fullName) body.fullName = form.fullName.trim();
  if (form.username !== user.username) body.username = form.username;
  if (form.bio !== user.bio) body.bio = form.bio;
  if (form.isPrivate !== user.isPrivate) body.isPrivate = form.isPrivate;
  const website = form.website.trim();
  if (website !== (user.links[0]?.url ?? "")) {
    body.links = website ? [{ title: user.links[0]?.title ?? "", url: website }, ...user.links.slice(1)] : user.links.slice(1);
  }
  return body;
}

export function EditProfileForm({ user }: { user: CurrentUser }) {
  const t = useTranslations("editProfile");
  const authErrors = useTranslations("auth");
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(() => fromUser(user));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const save = useMutation({
    mutationFn: userApi.updateMe,
    onSuccess: (updated) => {
      useSessionStore.getState().setUser(updated);
      setForm(fromUser(updated));
      void queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast(t("saved"));
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === "USERNAME_TAKEN") {
        setErrors({ username: authErrors("errors.usernameTaken") });
      } else {
        toast.error(authErrors("errors.generic"));
      }
    },
  });

  const body = diff(user, form);
  const dirty = Object.keys(body).length > 0;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const website = form.website.trim();
    const next: typeof errors = {};
    if (website && !profileLinkSchema.shape.url.safeParse(website).success) next.website = t("invalidUrl");
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === "username") next.username = authErrors("fieldErrors.username");
        else if (key === "fullName" || key === "bio") next[key] = issue.message;
      }
    }
    setErrors(next);
    if (Object.keys(next).length === 0 && dirty) save.mutate(body);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">
      <div className="flex items-center gap-4 rounded-[20px] bg-control p-4">
        <Avatar src={user.avatar} alt="" size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold">{user.username}</p>
          <p className="truncate text-sm text-muted">{user.fullName}</p>
        </div>
        <AvatarPicker hasAvatar={Boolean(user.avatar)}>
          {({ onClick, disabled }) => (
            <Button size="sm" onClick={onClick} disabled={disabled}>
              {t("changePhoto")}
            </Button>
          )}
        </AvatarPicker>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-bold">{t("fullName")}</h2>
        <Input
          label={t("fullName")}
          value={form.fullName}
          maxLength={64}
          onChange={(event) => set("fullName", event.target.value)}
          error={errors.fullName}
          hint={t("fullNameHint")}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-bold">{t("username")}</h2>
        <Input
          label={t("username")}
          value={form.username}
          maxLength={30}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          onChange={(event) => set("username", event.target.value.toLowerCase())}
          error={errors.username}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-bold">{t("website")}</h2>
        <Input
          label={t("website")}
          type="url"
          inputMode="url"
          value={form.website}
          onChange={(event) => set("website", event.target.value)}
          error={errors.website}
          hint={t("websiteHint")}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-bold">{t("bio")}</h2>
        <Textarea
          label={t("bio")}
          value={form.bio}
          maxLength={BIO_MAX}
          showCount
          rows={3}
          onChange={(event) => set("bio", event.target.value)}
          error={errors.bio}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-bold">{t("privacy")}</h2>
        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-stroke p-4">
          <span className="flex flex-col gap-1">
            <span className="text-sm font-semibold">{t("privacy")}</span>
            <span className="text-xs text-muted">{t("privacyHint")}</span>
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={form.isPrivate}
            onChange={(event) => set("isPrivate", event.target.checked)}
            className="peer sr-only"
          />
          <span
            aria-hidden
            className="relative h-6 w-10 shrink-0 rounded-full bg-stroke transition-colors peer-checked:bg-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-background after:shadow after:transition-[left] peer-checked:after:left-[18px]"
          />
        </label>
      </section>

      <div className="flex justify-end">
        <Button type="submit" size="lg" className="w-full sm:w-[252px]" disabled={!dirty} loading={save.isPending}>
          {t("submit")}
        </Button>
      </div>
    </form>
  );
}
