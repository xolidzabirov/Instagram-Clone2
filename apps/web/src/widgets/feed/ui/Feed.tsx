"use client";

import type { FeedMode } from "@ig/shared";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ROUTES } from "@/shared/config";
import { useTranslations } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { Button, ButtonLink, CheckIcon, EmptyState, Spinner } from "@/shared/ui";
import { PostCardSkeleton, useFeed } from "@/entities/post";
import { FeedPost } from "./FeedPost";

const MODES: { mode: FeedMode; href: string; key: "forYou" | "following" | "favorites" }[] = [
  { mode: "home", href: ROUTES.home, key: "forYou" },
  { mode: "following", href: "/?variant=following", key: "following" },
  { mode: "favorites", href: "/?variant=favorites", key: "favorites" },
];

/** "For you · Following · Favorites" above the feed (Instagram keeps the choice in ?variant=) */
export function FeedModeTabs({ mode }: { mode: FeedMode }) {
  const t = useTranslations("post");
  return (
    <nav aria-label={t("feedModes")} className="mb-2 flex justify-center gap-6 border-b border-separator md:mb-4">
      {MODES.map((item) => (
        <Link
          key={item.mode}
          href={item.href}
          aria-current={item.mode === mode ? "page" : undefined}
          className={cn(
            "-mb-px border-b py-3 text-[15px] font-semibold transition-colors",
            item.mode === mode ? "border-foreground text-foreground" : "border-transparent text-muted hover:text-foreground"
          )}
        >
          {t(item.key)}
        </Link>
      ))}
    </nav>
  );
}

function AllCaughtUp() {
  const t = useTranslations("post");
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <span className="flex size-[72px] items-center justify-center rounded-full bg-gradient-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5] p-[3px]">
        <span className="flex size-full items-center justify-center rounded-full bg-background">
          <CheckIcon className="size-9 text-[#d62976]" />
        </span>
      </span>
      <p className="text-xl">{t("allCaughtUp")}</p>
      <p className="text-sm text-muted">{t("allCaughtUpText")}</p>
    </div>
  );
}

/** The home feed: infinite, virtualized (only the cards near the viewport exist in the DOM) */
export function Feed({ mode }: { mode: FeedMode }) {
  const t = useTranslations("post");
  const common = useTranslations("common");
  const feed = useFeed(mode);
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  // The API may return a post on two pages when new posts arrive in between: keep the first
  const posts = useMemo(() => {
    const seen = new Set<string>();
    return (feed.data?.pages.flatMap((page) => page.items) ?? []).filter((post) =>
      seen.has(post.id) ? false : (seen.add(post.id), true)
    );
  }, [feed.data]);

  // Where the list starts on the page (below stories and tabs); measured once it is rendered
  const hasPosts = posts.length > 0;
  useLayoutEffect(() => {
    setScrollMargin(listRef.current?.offsetTop ?? 0);
  }, [hasPosts]);

  const virtualizer = useWindowVirtualizer({
    count: posts.length,
    estimateSize: () => 840,
    overscan: 3,
    scrollMargin,
    getItemKey: (index) => posts[index]?.id ?? index,
  });
  const items = virtualizer.getVirtualItems();
  const lastIndex = items.at(-1)?.index ?? -1;

  useEffect(() => {
    if (lastIndex >= posts.length - 3 && feed.hasNextPage && !feed.isFetchingNextPage) void feed.fetchNextPage();
  }, [lastIndex, posts.length, feed]);

  if (feed.isPending) {
    return (
      <div className="w-full">
        <PostCardSkeleton />
        <PostCardSkeleton />
      </div>
    );
  }

  if (feed.isError && posts.length === 0) {
    return (
      <EmptyState
        title={common("errorTitle")}
        description={common("errorDescription")}
        action={
          <Button variant="secondary" size="sm" onClick={() => void feed.refetch()}>
            {common("retry")}
          </Button>
        }
      />
    );
  }

  if (posts.length === 0) {
    return (
      <EmptyState
        title={t("emptyFeedTitle")}
        description={mode === "favorites" ? t("emptyFavoritesText") : t("emptyFeedText")}
        action={
          <ButtonLink href={ROUTES.explorePeople} size="sm">
            {t("findPeople")}
          </ButtonLink>
        }
      />
    );
  }

  return (
    <div className="w-full">
      <div ref={listRef} className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {items.map((item) => (
          <div
            key={item.key}
            data-index={item.index}
            ref={virtualizer.measureElement}
            className="absolute left-0 top-0 w-full"
            style={{ transform: `translateY(${item.start - scrollMargin}px)` }}
          >
            <FeedPost post={posts[item.index]!} priority={item.index === 0} />
          </div>
        ))}
      </div>
      {feed.isFetchingNextPage && (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      )}
      {!feed.hasNextPage && <AllCaughtUp />}
    </div>
  );
}
