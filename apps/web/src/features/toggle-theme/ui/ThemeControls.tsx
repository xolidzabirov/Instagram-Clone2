"use client";

import { useTranslations } from "@/shared/i18n";
import { DropdownItem, MoonIcon, SegmentedControl, SunIcon, SystemThemeIcon } from "@/shared/ui";
import { useAppTheme } from "../model/useAppTheme";

/** Menu row that flips between light and dark (the "More" menu) */
export function ThemeToggleItem() {
  const t = useTranslations("menu");
  const { isDark, setTheme } = useAppTheme();

  return (
    <DropdownItem
      icon={isDark ? <SunIcon /> : <MoonIcon />}
      onSelect={() => setTheme(isDark ? "light" : "dark")}
      // Stay open so the result of the switch is visible right away
      keepOpen
    >
      {isDark ? t("switchToLight") : t("switchToDark")}
    </DropdownItem>
  );
}

/** Full choice including "follow the system" (settings) */
export function ThemeSwitcher({ className }: { className?: string }) {
  const t = useTranslations("menu");
  const { choice, setTheme } = useAppTheme();

  return (
    <SegmentedControl
      ariaLabel={t("appearance")}
      value={choice}
      onChange={setTheme}
      className={className}
      options={[
        { value: "system", label: t("themeSystem"), icon: <SystemThemeIcon /> },
        { value: "light", label: t("themeLight"), icon: <SunIcon /> },
        { value: "dark", label: t("themeDark"), icon: <MoonIcon /> },
      ]}
    />
  );
}
