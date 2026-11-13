"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ApiError } from "@/shared/api";
import { ROUTES, profileRoute } from "@/shared/config";
import { useTranslations } from "@/shared/i18n";
import { Button, EmptyState, LockIcon } from "@/shared/ui";
import { PostCardSkeleton, PostGrid, usePost, useProfileGrid } from "@/entities/post";
import { FeedPost } from "@/widgets/feed";

function MorePosts({ username, exclude }: { username: string; exclude: string }) {
  const t = useTranslations("post");
  const router = useRouter();
  const grid = useProfileGrid(username, "posts");
  const posts = (grid.data?.pages[0]?.items ?? []).filter((post) => post.id !== exclude).slice(0, 6);
  if (posts.length === 0) return null;

  return (
    <section className="mt-10 border-t border-separator pt-10" aria-labelledby="more-posts">
      <h2 id="more-posts" className="mb-4 px-3 text-sm font-semibold text-muted md:px-0">
        {t.rich("morePostsFrom", {
          username,
          link: (chunks) => (
            <Link href={profileRoute(username)} className="text-foreground hover:opacity-60">
              {chunks}
            </Link>
          ),
        })}
      </h2>
      <PostGrid posts={posts} onPostClick={(id) => router.push(`/p/${id}`)} />
    </section>
  );
}

/** `/p/{id}`: one post on its own page (comments arrive with FE-9) */
export function PostPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const t = useTranslations("post");
  const profileT = useTranslations("profile");
  const common = useTranslations("common");
  const post = usePost(id);

  if (post.isPending) {
    return (
      <div className="w-full max-w-[470px] md:pt-8">
        <PostCardSkeleton />
      </div>
    );
  }

  if (post.isError) {
    const error = post.error;
    if (error instanceof ApiError && error.code === "PRIVATE_ACCOUNT") {
      return (
        <EmptyState icon={<LockIcon />} title={t("privateTitle")} description={profileT("privateText")} />
      );
    }
    if (error instanceof ApiError && error.status === 404) {
      return (
        <div className="flex flex-col items-center gap-6 px-6 pt-10 text-center md:pt-20">
          <h1 className="text-2xl font-bold">{t("notFoundTitle")}</h1>
          <p>
            {profileT("notFoundText")}{" "}
            <Link href={ROUTES.home} className="text-link hover:underline">
              {profileT("backHome")}
            </Link>
          </p>
        </div>
      );
    }
    return (
      <EmptyState
        title={common("errorTitle")}
        description={common("errorDescription")}
        action={
          <Button variant="secondary" size="sm" onClick={() => void post.refetch()}>
            {common("retry")}
          </Button>
        }
      />
    );
  }

  const data = post.data;
  const title = data.caption ? `${data.author.username}: «${data.caption.slice(0, 60)}»` : data.author.username;

  return (
    <div className="w-full max-w-[630px] pb-12 md:pt-8">
      <title>{`${title} • Instagram`}</title>
      <div className="mx-auto max-w-[470px]">
        <FeedPost post={data} priority />
      </div>
      <MorePosts username={data.author.username} exclude={data.id} />
    </div>
  );
}
