"use client";

import { useState } from "react";
import { ApiError } from "@/shared/api";
import { useTranslations } from "@/shared/i18n";
import { useDebouncedValue, useInfiniteScroll } from "@/shared/lib";
import { Button, Modal, SearchIcon, Skeleton, Spinner } from "@/shared/ui";
import { UserListItem, useFollowList, type FollowListKind } from "@/entities/user";
import { RemoveFollowerButton } from "@/features/block-user";
import { FollowButton } from "@/features/follow-user";

interface FollowListModalProps {
  kind: FollowListKind;
  username: string;
  /** The list belongs to the viewer: followers get a "Remove" button */
  isMe: boolean;
  onClose: () => void;
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-2" aria-hidden>
      <Skeleton className="size-11 rounded-full" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-3.5 w-40" />
      </div>
    </div>
  );
}

/** "Followers" / "Following" dialog with search inside the list and infinite scroll */
export function FollowListModal({ kind, username, isMe, onClose }: FollowListModalProps) {
  const t = useTranslations("follow");
  const common = useTranslations("common");
  const [search, setSearch] = useState("");
  const q = useDebouncedValue(search.trim(), 300);
  const list = useFollowList(kind, username, q);
  const items = list.data?.pages.flatMap((page) => page.items) ?? [];

  const sentinel = useInfiniteScroll({
    onLoadMore: () => void list.fetchNextPage(),
    enabled: Boolean(list.hasNextPage) && !list.isFetchingNextPage,
    rootMargin: "200px",
  });

  const isPrivate = list.error instanceof ApiError && list.error.code === "PRIVATE_ACCOUNT";

  return (
    <Modal
      open
      onClose={onClose}
      title={kind === "followers" ? t("followers") : t("followingTitle")}
      closeLabel={common("close")}
      size="sm"
      className="h-[min(400px,calc(100dvh-2rem))]"
    >
      <div className="sticky top-0 z-10 bg-elevated px-4 py-2">
        <label className="flex h-9 items-center gap-2 rounded-lg bg-control px-4 text-muted">
          <SearchIcon className="size-4 shrink-0" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("search")}
            aria-label={t("search")}
            className="h-full w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
          />
        </label>
      </div>

      {list.isPending ? (
        <div>
          {Array.from({ length: 6 }, (_, index) => (
            <RowSkeleton key={index} />
          ))}
        </div>
      ) : list.isError && !list.data ? (
        <div className="flex flex-col items-center gap-3 px-8 py-10 text-center text-sm text-muted">
          {isPrivate ? (
            <p>{t("privateList")}</p>
          ) : (
            <>
              <p>{common("errorDescription")}</p>
              <Button size="sm" variant="secondary" onClick={() => void list.refetch()}>
                {common("retry")}
              </Button>
            </>
          )}
        </div>
      ) : items.length === 0 ? (
        <p className="px-8 py-10 text-center text-sm text-muted">
          {q ? t("noResults") : kind === "followers" ? t("emptyFollowers") : t("emptyFollowing")}
        </p>
      ) : (
        <ul className={list.isFetching && !list.isFetchingNextPage ? "opacity-60 transition-opacity" : undefined}>
          {items.map((item) => (
            <li key={item.id}>
              <UserListItem
                user={item}
                onNavigate={onClose}
                action={
                  item.isMe ? null : isMe && kind === "followers" ? (
                    <RemoveFollowerButton user={item} />
                  ) : (
                    <FollowButton
                      target={{ id: item.id, username: item.username, avatar: item.avatar }}
                      following={item.following}
                      followRequested={item.followRequested}
                    />
                  )
                }
              />
            </li>
          ))}
        </ul>
      )}

      <div ref={sentinel} aria-hidden />
      {list.isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Spinner />
        </div>
      )}
    </Modal>
  );
}
