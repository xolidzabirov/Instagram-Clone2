"use client";

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
  FiMenu 
} from "react-icons/fi";
import { UserAvatar } from "@/src/entities/user";
import { useAuth } from "@/src/features/auth";

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    { label: "Главная", href: "/", icon: FiHome },
    { label: "Поисковый запрос", href: "/search", icon: FiSearch },
    { label: "Интересное", href: "/explore", icon: FiCompass },
    { label: "Reels", href: "/reels", icon: FiFilm },
    { label: "Сообщения", href: "/direct", icon: FiMessageSquare },
    { label: "Уведомления", href: "/notifications", icon: FiHeart },
    { label: "Создать", href: "/create", icon: FiPlusSquare },
  ];

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-30 w-16 xl:w-60 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black flex flex-col justify-between p-3 xl:p-5 transition-all">
      <div className="flex flex-col gap-6">
        <Link href="/" className="pt-2 px-2">
          <span className="hidden xl:block font-bold text-xl tracking-tighter">Instagram</span>
          <span className="xl:hidden font-black text-xl">IG</span>
        </Link>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors ${
                  isActive ? "font-bold" : "font-normal"
                }`}
              >
                <Icon className="w-6 h-6 flex-shrink-0" />
                <span className="hidden xl:inline text-sm">{item.label}</span>
              </Link>
            );
          })}

          <Link
            href="/profile"
            className="flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
          >
            <UserAvatar
              src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
              alt="Profile"
              size="xs"
            />
            <span className="hidden xl:inline text-sm">Профиль</span>
          </Link>
        </nav>
      </div>

      <button className="flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors text-left">
        <FiMenu className="w-6 h-6 flex-shrink-0" />
        <span className="hidden xl:inline text-sm">Ещё</span>
      </button>
    </aside>
  );
}
