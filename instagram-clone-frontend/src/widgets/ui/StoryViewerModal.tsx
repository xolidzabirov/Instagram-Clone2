"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { FiX, FiHeart, FiSend, FiPause, FiPlay } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import { useStoryStore } from "@/src/features/story";

export function StoryViewerModal() {
  const {
    stories,
    isOpen,
    activeStoryIndex,
    activeItemIndex,
    closeStory,
    nextItem,
    prevItem,
  } = useStoryStore();

  const [progress, setProgress] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [replyText, setReplyText] = useState<string>("");
  const [showHeartBurst, setShowHeartBurst] = useState<boolean>(false);
  const [isLiked, setIsLiked] = useState<boolean>(false);

  const currentStory = stories[activeStoryIndex];
  const currentItem = currentStory?.items[activeItemIndex];

  // Auto-progress timer
  useEffect(() => {
    if (!isOpen || isPaused || !currentItem) return;

    const duration = (currentItem.duration || 5) * 1000;
    const intervalTime = 50;
    const increment = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          setTimeout(() => nextItem(), 0);
          return 100;
        }
        return next;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isOpen, isPaused, activeStoryIndex, activeItemIndex, currentItem, nextItem]);

  // Reset progress when item changes
  useEffect(() => {
    setProgress(0);
    setIsLiked(false);
  }, [activeStoryIndex, activeItemIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeStory();
      if (e.key === "ArrowRight") nextItem();
      if (e.key === "ArrowLeft") prevItem();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeStory, nextItem, prevItem]);

  if (!isOpen || !currentStory || !currentItem) return null;

  const handleLike = () => {
    setIsLiked(!isLiked);
    setShowHeartBurst(true);
    setTimeout(() => setShowHeartBurst(false), 900);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setReplyText("");
    setShowHeartBurst(true);
    setTimeout(() => setShowHeartBurst(false), 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md">
      {/* Top Controls */}
      <button
        onClick={closeStory}
        className="absolute top-5 right-6 text-white hover:opacity-80 p-2 z-50"
        aria-label="Закрыть истории"
      >
        <FiX className="w-8 h-8" />
      </button>

      {/* Main Story Container */}
      <div className="relative w-full max-w-[420px] h-[85vh] max-h-[780px] bg-zinc-950 rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between border border-zinc-800 select-none">
        {/* Progress Bars */}
        <div className="absolute top-3 left-3 right-3 z-30 flex items-center gap-1.5">
          {currentStory.items.map((item, idx) => {
            let widthPercent = 0;
            if (idx < activeItemIndex) widthPercent = 100;
            else if (idx === activeItemIndex) widthPercent = progress;

            return (
              <div
                key={item.id}
                className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-white transition-all duration-75"
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* Story Header */}
        <div className="absolute top-7 left-3 right-3 z-30 flex items-center justify-between text-white drop-shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden relative border border-white/40">
              <Image
                src={currentStory.author.avatar}
                alt={currentStory.author.username}
                fill
                className="object-cover"
              />
            </div>
            <span className="text-sm font-semibold text-white">
              {currentStory.author.username}
            </span>
            <span className="text-xs text-white/70">2ч</span>
          </div>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-1 hover:opacity-80 text-white"
          >
            {isPaused ? <FiPlay className="w-5 h-5" /> : <FiPause className="w-5 h-5" />}
          </button>
        </div>

        {/* Tap navigation zones */}
        <div className="absolute inset-0 z-20 flex">
          <div
            className="w-1/3 h-full cursor-pointer"
            onClick={prevItem}
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          />
          <div
            className="w-2/3 h-full cursor-pointer"
            onClick={nextItem}
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          />
        </div>

        {/* Story Media */}
        <div className="relative w-full h-full flex items-center justify-center">
          <Image
            src={currentItem.url}
            alt="Story content"
            fill
            className="object-cover"
            priority
          />

          {/* Heart burst animation */}
          {showHeartBurst && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
              <FaHeart className="w-24 h-24 text-red-500 animate-heart-burst drop-shadow-lg" />
            </div>
          )}
        </div>

        {/* Story Footer / Reply */}
        <div className="relative z-30 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center gap-3">
          <form
            onSubmit={handleSendReply}
            className="flex-1 relative flex items-center"
          >
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Ответить ${currentStory.author.username}...`}
              className="w-full bg-white/10 hover:bg-white/20 focus:bg-white/20 text-white placeholder-white/70 rounded-full py-2.5 px-4 pr-10 text-sm border border-white/20 outline-none backdrop-blur-sm transition-all"
            />
            {replyText.trim() && (
              <button
                type="submit"
                className="absolute right-3 text-white hover:text-blue-400"
              >
                <FiSend className="w-4 h-4" />
              </button>
            )}
          </form>

          <button
            onClick={handleLike}
            className="text-white hover:scale-110 active:scale-95 transition-transform"
          >
            {isLiked ? (
              <FaHeart className="w-7 h-7 text-red-500" />
            ) : (
              <FiHeart className="w-7 h-7" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
