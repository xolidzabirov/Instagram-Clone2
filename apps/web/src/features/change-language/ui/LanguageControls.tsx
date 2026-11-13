"use client";

import { LOCALE_NAMES, LOCALES, useLocaleStore, useTranslations } from "@/shared/i18n";
import { DropdownItem, LanguageIcon, SegmentedControl } from "@/shared/ui";

/** Menu row that switches to the next language and shows the current one */
export function LanguageToggleItem() {
  const t = useTranslations("menu");
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);
  const next = LOCALES[(LOCALES.indexOf(locale) + 1) % LOCALES.length]!;

  return (
    <DropdownItem icon={<LanguageIcon />} onSelect={() => setLocale(next)} keepOpen>
      {t("language")}: {LOCALE_NAMES[locale]}
    </DropdownItem>
  );
}

export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations("menu");
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);

  return (
    <SegmentedControl
      ariaLabel={t("language")}
      value={locale}
      onChange={setLocale}
      className={className}
      options={LOCALES.map((value) => ({ value, label: LOCALE_NAMES[value] }))}
    />
  );
}
