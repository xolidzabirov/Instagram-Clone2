import { create } from "zustand";
import { persist } from "zustand/middleware";
import { en } from "./messages/en";
import { ru, type Messages } from "./messages/ru";

export const LOCALES = ["ru", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ru";

export const LOCALE_NAMES: Record<Locale, string> = { ru: "Русский", en: "English" };
export const MESSAGES: Record<Locale, Messages> = { ru, en };

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

/**
 * The chosen language, remembered in localStorage.
 * Hydration is manual (see I18nProvider): pages are prerendered in the default language, so the
 * first client render must match it before the saved choice is applied.
 */
export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: DEFAULT_LOCALE,
      setLocale: (locale) => set({ locale }),
    }),
    { name: "ig-locale", skipHydration: true }
  )
);
