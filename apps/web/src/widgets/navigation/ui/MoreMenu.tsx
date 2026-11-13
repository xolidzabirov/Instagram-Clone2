"use client";

import { ROUTES } from "@/shared/config";
import { useTranslations } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import {
  BookmarkIcon,
  Dropdown,
  DropdownItem,
  DropdownLink,
  DropdownSeparator,
  LogoutIcon,
  MenuIcon,
  SettingsIcon,
} from "@/shared/ui";
import { useLogout } from "@/features/auth";
import { LanguageToggleItem } from "@/features/change-language";
import { ThemeToggleItem } from "@/features/toggle-theme";
import { navItemClass, NavLabel } from "./NavItem";

/** "More" at the bottom of the sidebar: settings, saved, appearance, language, log out */
export function MoreMenu({ collapsed }: { collapsed: boolean }) {
  const t = useTranslations();
  const logout = useLogout();

  return (
    <Dropdown
      side="top"
      menuClassName="w-[266px]"
      trigger={(props, { open }) => (
        <button type="button" {...props} aria-label={t("nav.more")} className={cn(navItemClass, "w-full", open && "font-bold")}>
          <MenuIcon filled={open} className="size-6 shrink-0" />
          <NavLabel collapsed={collapsed}>{t("nav.more")}</NavLabel>
        </button>
      )}
    >
      <DropdownLink href={ROUTES.profile} icon={<SettingsIcon />}>
        {t("menu.settings")}
      </DropdownLink>
      <DropdownLink href={ROUTES.profile} icon={<BookmarkIcon />}>
        {t("menu.saved")}
      </DropdownLink>
      <ThemeToggleItem />
      <LanguageToggleItem />
      <DropdownSeparator />
      <DropdownItem icon={<LogoutIcon />} onSelect={() => logout.mutate()}>
        {t("menu.logout")}
      </DropdownItem>
    </Dropdown>
  );
}
