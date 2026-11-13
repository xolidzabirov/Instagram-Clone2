"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback } from "react";
import { formatCount, getRelativeTime } from "@/shared/lib";

/** `formatCount(12345)` → "12,3 тыс." / "12.3K" in the current language */
export function useFormatCount() {
  const locale = useLocale();
  return useCallback((value: number) => formatCount(value, locale), [locale]);
}

/** `relativeTime(post.createdAt)` → "3 ч." / "3h" in the current language */
export function useRelativeTime() {
  const t = useTranslations("time");
  return useCallback(
    (date: Date | string) => {
      const { unit, count } = getRelativeTime(date);
      return unit === "now" ? t("now") : t(unit, { count });
    },
    [t]
  );
}
