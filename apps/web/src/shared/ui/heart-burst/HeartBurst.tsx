"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/shared/lib";
import { HeartIcon } from "../icons";

/** Double-tap like animation. `trigger()` replays it; render `burst` inside a relative container. */
export function useHeartBurst(className?: string) {
  const [key, setKey] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const trigger = useCallback(() => {
    clearTimeout(timer.current);
    // A new key restarts the CSS animation even when the previous one is still playing
    setKey((k) => k + 1);
    timer.current = setTimeout(() => setKey(0), 850);
  }, []);

  const burst = key > 0 && (
    <div key={key} className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
      <HeartIcon filled className={cn("size-24 text-white animate-heart-burst drop-shadow-2xl", className)} />
    </div>
  );

  return { trigger, burst };
}
