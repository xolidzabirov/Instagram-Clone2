"use client";

import { useRouter } from "next/navigation";
import type { ProfileTab } from "@/shared/config";
import { useTranslations } from "@/shared/i18n";
import { useInfiniteScroll } from "@/shared/lib";
import { BookmarkIcon, Button, CameraIcon, EmptyState, ReelTabIcon, Spinner, TaggedIcon } from "@/shared/ui";
import { PostGrid, PostGridSkeleton, useProfileGrid } from "@/entities/post";
import { useCreatePostModal } from "@/features/create-post";

interface ProfileGridProps {
  username: string;
  tab: ProfileTab;
  isMe: boolean;
}

function EmptyGrid({ tab, isMe }: { tab: ProfileTab; isMe: boolean }) {
  const t = useTranslations("profile");
  const openCreatePost = useCreatePostModal((state) => state.open);

  switch (tab) {
    case "saved":
      return <EmptyState icon={<BookmarkIcon />} title={t("emptySavedTitle")} description={t("emptySavedText")} />;
    case "tagged":
      return isMe ? (
        <EmptyState icon={<TaggedIcon />} title={t("emptyTaggedOwnTitle")} description={t("emptyTaggedOwnText")} />
      ) : (
        <EmptyState icon={<TaggedIcon />} title={t("emptyTaggedTitle")} />
      );
    case "reels":
      return <EmptyState icon={<ReelTabIcon />} title={isMe ? t("emptyReelsOwnTitle") : t("emptyReelsTitle")} />;
    default:
      return isMe ? (
        <EmptyState
          icon={<CameraIcon />}
          title={t("emptyOwnTitle")}
          description={t("emptyOwnText")}
          action={
            <Button variant="link" onClick={openCreatePost}>
              {t("emptyOwnAction")}
            </Button>
          }
        />
      ) : (
        <EmptyState icon={<CameraIcon />} title={t("emptyTitle")} />
      );
  }
}

/** The grid under the tabs: infinite scroll, skeletons, empty and error states */
export function ProfileGrid({ username, tab, isMe }: ProfileGridProps) {
  const common = useTranslations("common");
  const router = useRouter();
  const grid = useProfileGrid(username, tab);
  const posts = grid.data?.pages.flatMap((page) => page.items) ?? [];

  const sentinel = useInfiniteScroll({
    onLoadMore: () => void grid.fetchNextPage(),
    enabled: Boolean(grid.hasNextPage) && !grid.isFetchingNextPage,
  });

  if (grid.isPending) return <PostGridSkeleton />;

  if (grid.isError && posts.length === 0) {
    return (
      <EmptyState
        title={common("errorTitle")}
        description={common("errorDescription")}
        action={
          <Button variant="secondary" size="sm" onClick={() => void grid.refetch()}>
            {common("retry")}
          </Button>
        }
      />
    );
  }

  if (posts.length === 0) return <EmptyGrid tab={tab} isMe={isMe} />;

  return (
    <>
      <PostGrid posts={posts} onPostClick={(id) => router.push(`/p/${id}`)} />
      <div ref={sentinel} aria-hidden />
      {grid.isFetchingNextPage && (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      )}
    </>
  );
}
