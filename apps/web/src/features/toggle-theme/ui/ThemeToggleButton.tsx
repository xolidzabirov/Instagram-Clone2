"use client";

import { FiMoon, FiSun } from "react-icons/fi";
import { useDarkMode } from "../model/useDarkMode";

interface ThemeToggleButtonProps {
  onToggle?: () => void;
}

export function ThemeToggleButton({ onToggle }: ThemeToggleButtonProps) {
  const { isDark, toggle } = useDarkMode();

  return (
    <button
      onClick={() => {
        toggle();
        onToggle?.();
      }}
      className="flex items-center gap-3 w-full p-3 text-sm rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left"
    >
      {isDark ? (
        <FiSun className="w-5 h-5 text-amber-500" />
      ) : (
        <FiMoon className="w-5 h-5 text-indigo-500" />
      )}
      <span>{isDark ? "Светлая тема" : "Тёмная тема"}</span>
    </button>
  );
}
