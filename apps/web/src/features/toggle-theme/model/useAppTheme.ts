"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

export type ThemeChoice = "system" | "light" | "dark";

const subscribeNever = () => () => {};

/**
 * Theme state that is safe to render: the saved choice lives in the browser, so it is
 * `undefined` on the server and during hydration and becomes known right after.
 */
export function useAppTheme() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const isClient = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false
  );

  return {
    /** What the user picked */
    choice: isClient ? (theme as ThemeChoice | undefined) : undefined,
    /** What is actually shown ("system" resolved to light or dark) */
    isDark: isClient ? resolvedTheme === "dark" : undefined,
    setTheme: (choice: ThemeChoice) => setTheme(choice),
  };
}
