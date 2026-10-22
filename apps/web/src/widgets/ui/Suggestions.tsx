"use client";

import { UserListItem } from "@/src/entities/user";
import type { UserPreview } from "@ig/shared";

const mockSuggestions: UserPreview[] = [
  {
    id: "sug1",
    username: "john_doe",
    fullName: "John Doe",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
    isVerified: false,
  },
  {
    id: "sug2",
    username: "sarah_k",
    fullName: "Sarah K.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100",
    isVerified: true,
  },
];

export function Suggestions() {
  return (
    <div className="hidden lg:flex flex-col w-80 pl-8 pt-6">
      <div className="flex items-center justify-between mb-4 px-4">
        <span className="text-xs font-semibold text-zinc-500">Рекомендации для вас</span>
        <button className="text-xs font-semibold hover:text-zinc-600">Все</button>
      </div>

      <div className="flex flex-col">
        {mockSuggestions.map((user) => (
          <UserListItem
            key={user.id}
            user={user}
            subtitle="Популярно"
            action={
              <button className="text-xs font-semibold text-blue-500 hover:text-blue-700">
                Подписаться
              </button>
            }
          />
        ))}
      </div>
    </div>
  );
}
