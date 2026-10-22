"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { FiSearch, FiX, FiClock } from "react-icons/fi";
import { useUIStore } from "@/src/features/ui";
import { UserAvatar } from "@/src/entities/user";

interface SearchResult {
  id: string;
  username: string;
  fullName: string;
  avatar: string;
  isVerified?: boolean;
  type: "user" | "hashtag";
  postCount?: number;
}

const MOCK_RESULTS: SearchResult[] = [
  {
    id: "u1",
    username: "alex_dev",
    fullName: "Alex | Fullstack Dev",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120",
    isVerified: true,
    type: "user",
  },
  {
    id: "u2",
    username: "travel_world",
    fullName: "World Explorer & Nomad",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120",
    isVerified: true,
    type: "user",
  },
  {
    id: "u3",
    username: "sarah_design",
    fullName: "Sarah | UI/UX Designer",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120",
    isVerified: false,
    type: "user",
  },
  {
    id: "u4",
    username: "elena_art",
    fullName: "Elena Petrova | Artist",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120",
    isVerified: false,
    type: "user",
  },
  {
    id: "h1",
    username: "nextjs",
    fullName: "#nextjs",
    avatar: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=120",
    type: "hashtag",
    postCount: 48200,
  },
  {
    id: "h2",
    username: "nature",
    fullName: "#nature",
    avatar: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=120",
    type: "hashtag",
    postCount: 125000,
  },
];

export function SearchDrawer() {
  const { isSearchOpen, closeSearch } = useUIStore();
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([
    MOCK_RESULTS[0],
    MOCK_RESULTS[1],
  ]);

  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return MOCK_RESULTS.filter(
      (item) =>
        item.username.toLowerCase().includes(q) ||
        item.fullName.toLowerCase().includes(q)
    );
  }, [query]);

  if (!isSearchOpen) return null;

  const handleClearRecent = () => {
    setRecentSearches([]);
  };

  const handleRemoveRecentItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setRecentSearches((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSelect = (item: SearchResult) => {
    if (!recentSearches.some((r) => r.id === item.id)) {
      setRecentSearches((prev) => [item, ...prev].slice(0, 10));
    }
    closeSearch();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-20 bg-black/30 backdrop-blur-[2px] transition-opacity"
        onClick={closeSearch}
      />

      {/* Drawer */}
      <div className="fixed left-16 top-0 bottom-0 z-30 w-96 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex flex-col gap-6">
          <h2 className="text-2xl font-bold tracking-tight">Поисковый запрос</h2>
          <div className="relative">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск..."
              autoFocus
              className="w-full pl-10 pr-9 py-2.5 bg-zinc-100 dark:bg-zinc-900 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700"
              >
                <FiX className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto py-2">
          {query.trim() === "" ? (
            <div>
              <div className="flex items-center justify-between px-6 py-2">
                <span className="text-sm font-semibold">Недавнее</span>
                {recentSearches.length > 0 && (
                  <button
                    onClick={handleClearRecent}
                    className="text-xs font-semibold text-blue-500 hover:text-blue-600"
                  >
                    Очистить всё
                  </button>
                )}
              </div>

              {recentSearches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-zinc-400 text-sm gap-2">
                  <FiClock className="w-8 h-8 opacity-40" />
                  <span>Нет недавних поисковых запросов.</span>
                </div>
              ) : (
                <div className="flex flex-col mt-2">
                  {recentSearches.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className="flex items-center justify-between px-6 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar src={item.avatar} alt={item.username} size="md" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate flex items-center gap-1">
                            {item.username}
                            {item.isVerified && (
                              <span className="text-blue-500 text-xs">●</span>
                            )}
                          </p>
                          <p className="text-xs text-zinc-500 truncate">
                            {item.fullName}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleRemoveRecentItem(e, item.id)}
                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
                        aria-label="Удалить из недавних"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col">
              {filteredResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-zinc-400 text-sm">
                  <span>Результатов не найдено.</span>
                </div>
              ) : (
                filteredResults.map((item) => (
                  <Link
                    key={item.id}
                    href={item.type === "user" ? "/profile" : "/explore"}
                    onClick={() => handleSelect(item)}
                    className="flex items-center gap-3 px-6 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                  >
                    <UserAvatar src={item.avatar} alt={item.username} size="md" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate flex items-center gap-1">
                        {item.username}
                        {item.isVerified && (
                          <span className="text-blue-500 text-xs">●</span>
                        )}
                      </p>
                      <p className="text-xs text-zinc-500 truncate">
                        {item.type === "hashtag"
                          ? `${item.postCount?.toLocaleString()} публикаций`
                          : item.fullName}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
