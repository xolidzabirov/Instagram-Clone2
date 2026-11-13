"use client";

import { NextIntlClientProvider } from "next-intl";
import { useEffect, useState, type ReactNode } from "react";
import { MESSAGES, useLocaleStore } from "./locale";

/**
 * Supplies translations to the whole app. The language is a client-side preference:
 * pages are prerendered in Russian and switch right after load if the user chose another one.
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useLocaleStore((state) => state.locale);
  // The visitor's time zone is only known in the browser; UTC keeps server and first render equal
  const [timeZone, setTimeZone] = useState("UTC");

  useEffect(() => {
    void useLocaleStore.persist.rehydrate();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading a browser-only value once after hydration
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]} timeZone={timeZone}>
      {children}
    </NextIntlClientProvider>
  );
}
