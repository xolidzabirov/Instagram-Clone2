"use client";

import type { ReactNode } from "react";
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
} from "react-icons/fi";
import { Avatar } from "@/shared/ui";
import { ROUTES } from "@/shared/config";
import { cn } from "@/shared/lib";
import { useAuth } from "@/features/auth";
import { useCreatePostModal } from "@/features/create-post";
import { mockCurrentUser } from "@/entities/user";
import { useSidebarStore } from "../model/useSidebarStore";
import { MoreMenu } from "./MoreMenu";
import { SearchPanel } from "./SearchPanel";
import { NotificationsPanel } from "./NotificationsPanel";

const itemClass =
  "flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors text-left";

function NavLabel({ collapsed, children }: { collapsed: boolean; children: ReactNode }) {
  return collapsed ? null : <span className="hidden xl:inline text-sm">{children}</span>;
}

interface NavLinkProps {
  href: string;
  icon: ReactNode;
  label: string;
  isActive: boolean;
  collapsed: boolean;
  onClick: () => void;
}

function NavLink({ href, icon, label, isActive, collapsed, onClick }: NavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        itemClass,
        isActive ? "font-bold text-zinc-900 dark:text-zinc-100" : "text-zinc-700 dark:text-zinc-300"
      )}
    >
      {icon}
      <NavLabel collapsed={collapsed}>{label}</NavLabel>
    </Link>
  );
}

interface NavButtonProps {
  icon: ReactNode;
  label: string;
  isActive?: boolean;
  collapsed: boolean;
  onClick: () => void;
}

function NavButton({ icon, label, isActive = false, collapsed, onClick }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        itemClass,
        isActive
          ? "font-bold border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
          : "text-zinc-700 dark:text-zinc-300"
      )}
    >
      {icon}
      <NavLabel collapsed={collapsed}>{label}</NavLabel>
    </button>
  );
}

const iconClass = "w-6 h-6 flex-shrink-0";

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const openCreatePost = useCreatePostModal((s) => s.open);
  const { activePanel, isMoreMenuOpen, togglePanel, toggleMoreMenu, closeAll } = useSidebarStore();

  const isCollapsed = activePanel !== null;
  const navLink = (href: string, icon: ReactNode, label: string, isActive: boolean) => (
    <NavLink
      href={href}
      icon={icon}
      label={label}
      isActive={isActive}
      collapsed={isCollapsed}
      onClick={closeAll}
    />
  );

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-0 bottom-0 z-30 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black flex flex-col justify-between p-3 xl:p-4 transition-all duration-300",
          isCollapsed ? "w-16" : "w-16 xl:w-60"
        )}
      >
        <div className="flex flex-col gap-6">
          {/* Logo */}
          <Link href={ROUTES.home} onClick={closeAll} className="pt-2 px-2 flex items-center h-10">
            {!isCollapsed ? (
              <>
                <span className="hidden xl:block font-bold text-2xl tracking-tighter">Instagram</span>
                <span className="xl:hidden font-black text-xl">IG</span>
              </>
            ) : (
              <span className="font-black text-xl mx-auto">IG</span>
            )}
          </Link>

          {/* Navigation */}
          <nav className="flex flex-col gap-1">
            {navLink(ROUTES.home, <FiHome className={iconClass} />, "Главная", pathname === ROUTES.home && !isCollapsed)}
            <NavButton
              icon={<FiSearch className={iconClass} />}
              label="Поисковый запрос"
              isActive={activePanel === "search"}
              collapsed={isCollapsed}
              onClick={() => togglePanel("search")}
            />
            {navLink(ROUTES.explore, <FiCompass className={iconClass} />, "Интересное", pathname === ROUTES.explore)}
            {navLink(ROUTES.reels, <FiFilm className={iconClass} />, "Reels", pathname === ROUTES.reels)}
            {navLink(ROUTES.direct, <FiMessageSquare className={iconClass} />, "Сообщения", (pathname ?? "").startsWith(ROUTES.direct))}
            <NavButton
              icon={<FiHeart className={iconClass} />}
              label="Уведомления"
              isActive={activePanel === "notifications"}
              collapsed={isCollapsed}
              onClick={() => togglePanel("notifications")}
            />
            <NavButton
              icon={<FiPlusSquare className={iconClass} />}
              label="Создать"
              collapsed={isCollapsed}
              onClick={() => {
                closeAll();
                openCreatePost();
              }}
            />
            {navLink(
              ROUTES.profile,
              <Avatar src={user?.avatar || mockCurrentUser.avatar} alt="Profile" size="xs" />,
              "Профиль",
              pathname === ROUTES.profile
            )}
          </nav>
        </div>

        {/* More Menu & Trigger */}
        <div className="relative">
          {isMoreMenuOpen && <MoreMenu />}
          <button
            onClick={toggleMoreMenu}
            className={cn(
              itemClass,
              "w-full",
              isMoreMenuOpen ? "font-bold" : "text-zinc-700 dark:text-zinc-300"
            )}
          >
            <FiMenu className={iconClass} />
            <NavLabel collapsed={isCollapsed}>Ещё</NavLabel>
          </button>
        </div>
      </aside>

      <SearchPanel />
      <NotificationsPanel />
    </>
  );
}
