"use client";

import { useState } from "react";
import Image from "next/image";
import { Sidebar } from "@/src/widgets";
import { UserAvatar } from "@/src/entities/user";
import { useAuth } from "@/src/features/auth";
import { 
  FiEdit, 
  FiPhone, 
  FiVideo, 
  FiInfo, 
  FiSmile, 
  FiImage, 
  FiHeart, 
  FiSend 
} from "react-icons/fi";

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isMe: boolean;
}

interface Chat {
  id: string;
  user: {
    id: string;
    username: string;
    fullName: string;
    avatar: string;
    isOnline: boolean;
  };
  lastMessage: string;
  lastMessageTime: string;
  unreadCount?: number;
  messages: Message[];
}

const INITIAL_CHATS: Chat[] = [
  {
    id: "chat_1",
    user: {
      id: "u1",
      username: "alex_dev",
      fullName: "Alex",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120",
      isOnline: true,
    },
    lastMessage: "Привет! Как продвигается разработка клона Instagram?",
    lastMessageTime: "12 мин.",
    unreadCount: 1,
    messages: [
      {
        id: "m1",
        senderId: "u1",
        text: "Привет! Как продвигается разработка клона Instagram?",
        timestamp: "14:20",
        isMe: false,
      },
      {
        id: "m2",
        senderId: "me",
        text: "Отлично! Реализовал FSD архитектуру, сторис с таймером, создание постов с фильтрами и директ!",
        timestamp: "14:22",
        isMe: true,
      },
      {
        id: "m3",
        senderId: "u1",
        text: "Круто! Архитектура выглядит очень надежно и чисто 🚀",
        timestamp: "14:25",
        isMe: false,
      },
    ],
  },
  {
    id: "chat_2",
    user: {
      id: "u2",
      username: "sarah_design",
      fullName: "Sarah Designer",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120",
      isOnline: false,
    },
    lastMessage: "Отправила новые макеты в фигму",
    lastMessageTime: "2 ч.",
    messages: [
      {
        id: "m21",
        senderId: "u2",
        text: "Привет! Отправила новые макеты в фигму, посмотри когда будет время",
        timestamp: "12:15",
        isMe: false,
      },
    ],
  },
  {
    id: "chat_3",
    user: {
      id: "u3",
      username: "travel_world",
      fullName: "Travel World",
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120",
      isOnline: true,
    },
    lastMessage: "Увидимся в горах на выходных! 🏔️",
    lastMessageTime: "Вчера",
    messages: [
      {
        id: "m31",
        senderId: "u3",
        text: "Увидимся в горах на выходных! 🏔️",
        timestamp: "Вчера",
        isMe: false,
      },
    ],
  },
];

export default function DirectPage() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>(INITIAL_CHATS);
  const [activeChatId, setActiveChatId] = useState<string>("chat_1");
  const [inputMessage, setInputMessage] = useState("");

  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0];

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || !activeChat) return;

    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      senderId: "me",
      text: inputMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isMe: true,
    };

    setChats((prev) =>
      prev.map((c) => {
        if (c.id === activeChat.id) {
          return {
            ...c,
            lastMessage: newMsg.text,
            lastMessageTime: "Сейчас",
            unreadCount: 0,
            messages: [...c.messages, newMsg],
          };
        }
        return c;
      })
    );

    setInputMessage("");
  };

  const handleSendHeart = () => {
    if (!activeChat) return;
    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      senderId: "me",
      text: "❤️",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isMe: true,
    };

    setChats((prev) =>
      prev.map((c) => {
        if (c.id === activeChat.id) {
          return {
            ...c,
            lastMessage: "❤️",
            lastMessageTime: "Сейчас",
            messages: [...c.messages, newMsg],
          };
        }
        return c;
      })
    );
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100">
      <Sidebar />
      <main className="flex-1 flex justify-center pl-16 xl:pl-60">
        <div className="w-full max-w-[975px] h-screen p-4 flex">
          <div className="w-full h-full border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden flex bg-white dark:bg-zinc-950 shadow-sm">
            {/* Left Chat List Panel */}
            <div className="w-80 md:w-96 border-r border-zinc-200 dark:border-zinc-800 flex flex-col flex-shrink-0">
              {/* Header */}
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <h2 className="font-bold text-lg tracking-tight">
                  {user?.username || "alex_dev"}
                </h2>
                <button
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                  aria-label="Новое сообщение"
                >
                  <FiEdit className="w-5 h-5" />
                </button>
              </div>

              {/* Chat items */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Сообщения
                </div>
                {chats.map((chat) => {
                  const isActive = chat.id === activeChatId;
                  return (
                    <div
                      key={chat.id}
                      onClick={() => {
                        setActiveChatId(chat.id);
                        setChats((prev) =>
                          prev.map((c) =>
                            c.id === chat.id ? { ...c, unreadCount: 0 } : c
                          )
                        );
                      }}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                        isActive
                          ? "bg-zinc-100 dark:bg-zinc-900"
                          : "hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                      }`}
                    >
                      <div className="relative">
                        <UserAvatar
                          src={chat.user.avatar}
                          alt={chat.user.username}
                          size="md"
                        />
                        {chat.user.isOnline && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-zinc-950 rounded-full" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {chat.user.username}
                        </p>
                        <p className="text-xs text-zinc-500 truncate mt-0.5">
                          {chat.lastMessage}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-[11px] text-zinc-400">
                          {chat.lastMessageTime}
                        </span>
                        {chat.unreadCount && chat.unreadCount > 0 ? (
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Chat Thread Panel */}
            {activeChat ? (
              <div className="flex-1 flex flex-col h-full bg-white dark:bg-zinc-950">
                {/* Chat Top Header */}
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      src={activeChat.user.avatar}
                      alt={activeChat.user.username}
                      size="sm"
                    />
                    <div>
                      <h3 className="font-semibold text-sm">
                        {activeChat.user.username}
                      </h3>
                      <p className="text-[11px] text-zinc-400">
                        {activeChat.user.isOnline ? "В сети" : "Был(-а) недавно"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300">
                    <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                      <FiPhone className="w-5 h-5" />
                    </button>
                    <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                      <FiVideo className="w-5 h-5" />
                    </button>
                    <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                      <FiInfo className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                  {/* Chat User Info Intro */}
                  <div className="flex flex-col items-center justify-center py-6 gap-2 border-b border-zinc-100 dark:border-zinc-900 mb-2">
                    <UserAvatar
                      src={activeChat.user.avatar}
                      alt={activeChat.user.username}
                      size="xl"
                    />
                    <h4 className="font-bold text-base">{activeChat.user.fullName}</h4>
                    <p className="text-xs text-zinc-400">@{activeChat.user.username} • Instagram</p>
                    <button className="mt-1 px-4 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                      Смотреть профиль
                    </button>
                  </div>

                  {/* Messages */}
                  {activeChat.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        msg.isMe ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          msg.isMe
                            ? "bg-blue-600 text-white rounded-br-sm"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-sm"
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-zinc-400 mt-1 px-1">
                        {msg.timestamp}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Input Bar */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-3"
                >
                  <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-full border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900">
                    <button
                      type="button"
                      className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                      aria-label="Эмодзи"
                    >
                      <FiSmile className="w-5 h-5" />
                    </button>
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Напишите сообщение..."
                      className="flex-1 bg-transparent text-sm focus:outline-none"
                    />
                    <button
                      type="button"
                      className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                      aria-label="Изображение"
                    >
                      <FiImage className="w-5 h-5" />
                    </button>
                  </div>

                  {inputMessage.trim() ? (
                    <button
                      type="submit"
                      className="text-blue-500 hover:text-blue-600 font-semibold text-sm px-2"
                    >
                      Отправить
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendHeart}
                      className="text-zinc-500 hover:text-red-500 transition-colors p-2"
                      aria-label="Отправить лайк"
                    >
                      <FiHeart className="w-6 h-6 hover:fill-red-500" />
                    </button>
                  )}
                </form>
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
