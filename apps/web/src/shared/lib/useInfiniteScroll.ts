"use client";

import { useEffect, useRef } from "react";

interface Options {
  /** Load the next page; called when the sentinel comes near the viewport */
  onLoadMore: () => void;
  /** False while a page is loading or when there is nothing more to load */
  enabled: boolean;
  /** Start loading this far before the end is visible */
  rootMargin?: string;
}

/**
 * Infinite list helper: put the returned ref on an empty element after the last item.
 * Works inside scrollable modals too (the observer follows the nearest scrolling ancestor).
 */
export function useInfiniteScroll<T extends Element = HTMLDivElement>({
  onLoadMore,
  enabled,
  rootMargin = "600px",
}: Options) {
  const ref = useRef<T>(null);
  const callback = useRef(onLoadMore);

  useEffect(() => {
    callback.current = onLoadMore;
  });

  useEffect(() => {
    const node = ref.current;
    if (!node || !enabled) return;
    const observer = new IntersectionObserver((entries) => entries[0]?.isIntersecting && callback.current(), {
      rootMargin,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, rootMargin]);

  return ref;
}
