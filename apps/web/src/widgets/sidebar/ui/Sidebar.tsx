"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  FiHome, 
  FiSearch, 
  FiCompass, 
  FiFilm, 
  FiMessageSquare, 
  FiHeart, 
  FiPlusSquare, 
  FiMenu,
  FiMoon,
  FiSun,
  FiBookmark,
  FiSettings,
  FiLogOut
} from "react-icons/fi";
import { UserAvatar } from "@/src/entities/user";
import { useAuth } from "@/src/features/auth";
import { useUIStore } from "@/src/features/ui";
import { SearchDrawer } from "./SearchDrawer";
import { NotificationsDrawer } from "./NotificationsDrawer";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const {
    isSearchOpen,
    isNotificationsOpen,
    isMoreMenuOpen,
    openCreateModal,
    toggleSearch,
    toggleNotifications,
    toggleMoreMenu,
    closeMoreMenu,
    closeAllPanels,
  } = useUIStore();

  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains("dark"));
  }, []);

  const handleToggleTheme = () => {
    const isDark = document.documentElement.classList.toggle("dark");
    setIsDarkMode(isDark);
    closeMoreMenu();
  };

  const isCollapsed = isSearchOpen || isNotificationsOpen;

  return (
    <>
      <aside
        className={`fixed left-0 top-0 bottom-0 z-30 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black flex flex-col justify-between p-3 xl:p-4 transition-all duration-300 ${
          isCollapsed ? "w-16" : "w-16 xl:w-60"
        }`}
      >
        <div className="flex flex-col gap-6">
          {/* Logo */}
          <Link
            href="/"
            onClick={closeAllPanels}
            className="pt-2 px-2 flex items-center h-10"
          >
            {!isCollapsed ? (
              <>
                <span className="hidden xl:block font-bold text-2xl tracking-tighter">
                  Instagram
                </span>
                <span className="xl:hidden font-black text-xl">IG</span>
              </>
            ) : (
              <span className="font-black text-xl mx-auto">IG</span>
            )}
          </Link>

          {/* Navigation */}
          <nav className="flex flex-col gap-1">
            {/* Home */}
            <Link
              href="/"
              onClick={closeAllPanels}
              className={`flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors ${
                pathname === "/" && !isSearchOpen && !isNotificationsOpen
                  ? "font-bold text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-700 dark:text-zinc-300"
              }`}
            >
              <FiHome className="w-6 h-6 flex-shrink-0" />
              {!isCollapsed && <span className="hidden xl:inline text-sm">Главная</span>}
            </Link>

            {/* Search Button */}
            <button
              onClick={toggleSearch}
              className={`flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors text-left ${
                isSearchOpen
                  ? "font-bold border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-700 dark:text-zinc-300"
              }`}
            >
              <FiSearch className="w-6 h-6 flex-shrink-0" />
              {!isCollapsed && (
                <span className="hidden xl:inline text-sm">Поисковый запрос</span>
              )}
            </button>

            {/* Explore */}
            <Link
              href="/explore"
              onClick={closeAllPanels}
              className={`flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors ${
                pathname === "/explore"
                  ? "font-bold text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-700 dark:text-zinc-300"
              }`}
            >
              <FiCompass className="w-6 h-6 flex-shrink-0" />
              {!isCollapsed && <span className="hidden xl:inline text-sm">Интересное</span>}
            </Link>

            {/* Reels */}
            <Link
              href="/reels"
              onClick={closeAllPanels}
              className={`flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors ${
                pathname === "/reels"
                  ? "font-bold text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-700 dark:text-zinc-300"
              }`}
            >
              <FiFilm className="w-6 h-6 flex-shrink-0" />
              {!isCollapsed && <span className="hidden xl:inline text-sm">Reels</span>}
            </Link>

            {/* Direct */}
            <Link
              href="/direct"
              onClick={closeAllPanels}
              className={`flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors ${
                pathname.startsWith("/direct")
                  ? "font-bold text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-700 dark:text-zinc-300"
              }`}
            >
              <FiMessageSquare className="w-6 h-6 flex-shrink-0" />
              {!isCollapsed && <span className="hidden xl:inline text-sm">Сообщения</span>}
            </Link>

            {/* Notifications Button */}
            <button
              onClick={toggleNotifications}
              className={`flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors text-left ${
                isNotificationsOpen
                  ? "font-bold border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-700 dark:text-zinc-300"
              }`}
            >
              <FiHeart className="w-6 h-6 flex-shrink-0" />
              {!isCollapsed && (
                <span className="hidden xl:inline text-sm">Уведомления</span>
              )}
            </button>

            {/* Create Post Modal Trigger */}
            <button
              onClick={openCreateModal}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors text-left text-zinc-700 dark:text-zinc-300"
            >
              <FiPlusSquare className="w-6 h-6 flex-shrink-0" />
              {!isCollapsed && <span className="hidden xl:inline text-sm">Создать</span>}
            </button>

            {/* Profile Link */}
            <Link
              href="/profile"
              onClick={closeAllPanels}
              className={`flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors ${
                pathname === "/profile"
                  ? "font-bold text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-700 dark:text-zinc-300"
              }`}
            >
              <UserAvatar
                src={
                  user?.avatar ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"
                }
                alt="Profile"
                size="xs"
              />
              {!isCollapsed && <span className="hidden xl:inline text-sm">Профиль</span>}
            </Link>
          </nav>
        </div>

        {/* More Menu & Trigger */}
        <div className="relative">
          {isMoreMenuOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={closeMoreMenu}
              />

              {/* Popover */}
              <div className="absolute bottom-14 left-0 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-2 z-50 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150">
                <button
                  onClick={handleToggleTheme}
                  className="flex items-center gap-3 w-full p-3 text-sm rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left"
                >
                  {isDarkMode ? (
                    <FiSun className="w-5 h-5 text-amber-500" />
                  ) : (
                    <FiMoon className="w-5 h-5 text-indigo-500" />
                  )}
                  <span>
                    {isDarkMode ? "Светлая тема" : "Тёмная тема"}
                  </span>
                </button>

                <Link
                  href="/profile"
                  onClick={closeMoreMenu}
                  className="flex items-center gap-3 w-full p-3 text-sm rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <FiBookmark className="w-5 h-5" />
                  <span>Сохраненное</span>
                </Link>

                <Link
                  href="/profile"
                  onClick={closeMoreMenu}
                  className="flex items-center gap-3 w-full p-3 text-sm rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
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
          )}

          <button
            onClick={toggleMoreMenu}
            className={`flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors text-left w-full ${
              isMoreMenuOpen ? "font-bold" : "text-zinc-700 dark:text-zinc-300"
            }`}
          >
            <FiMenu className="w-6 h-6 flex-shrink-0" />
            {!isCollapsed && <span className="hidden xl:inline text-sm">Ещё</span>}
          </button>
        </div>
      </aside>

      {/* Drawers */}
      <SearchDrawer />
      <NotificationsDrawer />
    </>
  );
}
