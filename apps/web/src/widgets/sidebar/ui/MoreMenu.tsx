"use client";

import Link from "next/link";
import { FiBookmark, FiSettings, FiLogOut } from "react-icons/fi";
import { ROUTES } from "@/shared/config";
import { useAuth } from "@/features/auth";
import { ThemeToggleButton } from "@/features/toggle-theme";
import { useSidebarStore } from "../model/useSidebarStore";

const menuItemClass =
  "flex items-center gap-3 w-full p-3 text-sm rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors";

export function MoreMenu() {
  const { logout } = useAuth();
  const closeMoreMenu = useSidebarStore((s) => s.closeMoreMenu);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={closeMoreMenu} />

      {/* Popover */}
      <div className="absolute bottom-14 left-0 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-2 z-50 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150">
        <ThemeToggleButton onToggle={closeMoreMenu} />

        <Link href={ROUTES.profile} onClick={closeMoreMenu} className={menuItemClass}>
          <FiBookmark className="w-5 h-5" />
          <span>Сохраненное</span>
        </Link>

        <Link href={ROUTES.profile} onClick={closeMoreMenu} className={menuItemClass}>
          <FiSettings className="w-5 h-5" />
          <span>Настройки</span>
        </Link>

        <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-1" />

        <button
          onClick={() => {
            closeMoreMenu();
            logout();
          }}
          className="flex items-center gap-3 w-full p-3 text-sm rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left"
        >
          <FiLogOut className="w-5 h-5" />
          <span>Выйти</span>
        </button>
      </div>
    </>
  );
}
