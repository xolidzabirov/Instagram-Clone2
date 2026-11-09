"use client";

import { useState } from "react";
import Image from "next/image";
import { FiHeart, FiMessageCircle, FiUserPlus } from "react-icons/fi";
import { Avatar } from "@/shared/ui";
import { useSidebarStore } from "../model/useSidebarStore";
import { mockNotifications, type NotificationItem } from "../model/mocks";

export function NotificationsPanel() {
  const isOpen = useSidebarStore((s) => s.activePanel === "notifications");
  const closePanel = useSidebarStore((s) => s.closePanel);
  const [notifications, setNotifications] = useState(mockNotifications);

  if (!isOpen) return null;

  const toggleFollow = (id: string) => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isFollowing: !item.isFollowing } : item
      )
    );
  };

  const todayList = notifications.filter((n) => n.category === "today");
  const weekList = notifications.filter((n) => n.category === "week");
  const earlierList = notifications.filter((n) => n.category === "earlier");

  const renderItem = (item: NotificationItem) => (
    <div
      key={item.id}
      className="flex items-center justify-between gap-3 px-6 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="relative flex-shrink-0">
          <Avatar src={item.user.avatar} alt={item.user.username} size="md" />
          <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-white dark:bg-black text-[10px]">
            {item.type === "like" && <FiHeart className="w-3 h-3 text-red-500 fill-red-500" />}
            {item.type === "comment" && <FiMessageCircle className="w-3 h-3 text-blue-500 fill-blue-500" />}
            {item.type === "follow" && <FiUserPlus className="w-3 h-3 text-green-500" />}
          </div>
        </div>

        <div className="text-xs min-w-0">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            {item.user.username}
          </span>{" "}
          <span className="text-zinc-700 dark:text-zinc-300">{item.text}</span>{" "}
          <span className="text-zinc-400 text-[11px] whitespace-nowrap">{item.time}</span>
        </div>
      </div>

      {item.postImage && (
        <div className="relative w-11 h-11 flex-shrink-0 rounded overflow-hidden">
          <Image src={item.postImage} alt="Post" fill className="object-cover" />
        </div>
      )}

      {item.type === "follow" && (
        <button
          onClick={() => toggleFollow(item.id)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-colors ${
            item.isFollowing
              ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-300 dark:hover:bg-zinc-700"
              : "bg-blue-500 hover:bg-blue-600 text-white"
          }`}
        >
          {item.isFollowing ? "Подписки" : "Подписаться"}
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-20 bg-black/30 backdrop-blur-[2px] transition-opacity"
        onClick={closePanel}
      />

      {/* Drawer */}
      <div className="fixed left-16 top-0 bottom-0 z-30 w-96 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-2xl font-bold tracking-tight">Уведомления</h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-2">
          {todayList.length > 0 && (
            <div className="mb-4">
              <h3 className="px-6 py-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Сегодня
              </h3>
              {todayList.map(renderItem)}
            </div>
          )}

          {weekList.length > 0 && (
            <div className="mb-4">
              <h3 className="px-6 py-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                На этой неделе
              </h3>
              {weekList.map(renderItem)}
            </div>
          )}

          {earlierList.length > 0 && (
            <div className="mb-4">
              <h3 className="px-6 py-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Ранее
              </h3>
              {earlierList.map(renderItem)}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
