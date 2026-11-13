"use client";

import type { Post } from "@ig/shared";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { profileRoute } from "@/shared/config";
import { useFormatter, useRelativeTime, useTranslations } from "@/shared/i18n";
import { Avatar, CommentIcon, RichText, Skeleton, VerifiedBadge } from "@/shared/ui";
import { PostMedia } from "./PostMedia";

const CAPTION_PREVIEW = 125;

interface PostCardProps {
  post: Post & { isSuggested?: boolean };
  /** Feature buttons: like, repost, share, save and the "…" menu */
  likeSlot?: ReactNode;
  repostSlot?: ReactNode;
  shareSlot?: ReactNode;
  saveSlot?: ReactNode;
  menuSlot?: ReactNode;
  /** e.g. "· Follow" next to the name of a suggested account */
  headerAction?: ReactNode;
  onDoubleTap?: () => void;
  /** First card of the feed: load its image eagerly */
  priority?: boolean;
}

function Caption({ post }: { post: Post }) {
  const t = useTranslations("post");
  const [expanded, setExpanded] = useState(false);
  const firstBreak = post.caption.indexOf("\n");
  const cut = Math.min(CAPTION_PREVIEW, firstBreak === -1 ? Infinity : firstBreak);
  const long = post.caption.length > cut;
  const text = expanded || !long ? post.caption : post.caption.slice(0, cut).trimEnd();

  return (
    <div className="whitespace-pre-line break-words text-sm leading-[18px]">
      <Link href={profileRoute(post.author.username)} className="mr-1 font-semibold hover:opacity-60">
        {post.author.username}
      </Link>
      <RichText text={text} />
      {long && !expanded && (
        <>
          …{" "}
          <button type="button" onClick={() => setExpanded(true)} className="text-muted">
            {t("more")}
          </button>
        </>
      )}
    </div>
  );
}

/** One post as Instagram shows it in the feed */
export function PostCard({
  post,
  likeSlot,
  repostSlot,
  shareSlot,
  saveSlot,
  menuSlot,
  headerAction,
  onDoubleTap,
  priority,
}: PostCardProps) {
  const t = useTranslations("post");
  const common = useTranslations("common");
  const relativeTime = useRelativeTime();
  const format = useFormatter();
  const authorHref = profileRoute(post.author.username);
  const postHref = `/p/${post.id}`;

  return (
    <article className="border-b border-separator pb-4 md:mb-4 md:pb-5" aria-label={post.author.username}>
      <header className="flex items-center gap-3 px-3 py-2.5 md:px-1 md:pb-3 md:pt-0">
        <Link href={authorHref} aria-hidden tabIndex={-1}>
          <Avatar src={post.author.avatar} alt="" size="sm" />
        </Link>
        <div className="min-w-0 flex-1 text-sm leading-[18px]">
          <div className="flex items-center gap-1">
            <Link href={authorHref} className="truncate font-semibold hover:opacity-60">
              {post.author.username}
            </Link>
            {post.author.isVerified && <VerifiedBadge label={common("verified")} className="text-xs" />}
            <span className="shrink-0 text-muted">
              •{" "}
              <Link href={postHref} className="hover:opacity-60">
                <time dateTime={post.createdAt} title={format.dateTime(new Date(post.createdAt), { dateStyle: "long" })}>
                  {relativeTime(post.createdAt)}
                </time>
              </Link>
            </span>
            {headerAction}
          </div>
          {post.isSuggested ? (
            <p className="truncate text-xs text-muted">{t("suggested")}</p>
          ) : (
            post.location && <p className="truncate text-xs">{post.location.name}</p>
          )}
        </div>
        {menuSlot}
      </header>

      <PostMedia
        media={post.media}
        aspectRatio={post.aspectRatio}
        onDoubleTap={onDoubleTap}
        priority={priority}
        className="md:rounded-[4px] md:border md:border-separator"
      />

      <div className="flex flex-col gap-1.5 px-3 pt-1 md:px-1">
        <div className="-mx-2 flex items-center">
          {likeSlot}
          {!post.commentsDisabled && (
            <Link
              href={postHref}
              aria-label={t("comment")}
              className="p-2 transition-opacity hover:opacity-60"
            >
              <CommentIcon className="size-6 -scale-x-100" />
            </Link>
          )}
          {repostSlot}
          {shareSlot}
          <div className="ml-auto">{saveSlot}</div>
        </div>

        <p className="text-sm font-semibold">
          {post.likesCount === null
            ? t("likesHidden")
            : post.likesCount === 0
              ? t("beFirst")
              : t("likes", { count: post.likesCount })}
        </p>

        {post.caption && <Caption post={post} />}

        {post.commentsDisabled ? null : post.commentsCount > 0 ? (
          <Link href={postHref} className="text-sm text-muted hover:opacity-70">
            {t("viewComments", { count: post.commentsCount })}
          </Link>
        ) : null}
      </div>
    </article>
  );
}

export function PostCardSkeleton() {
  return (
    <div className="border-b border-separator pb-5 md:mb-4" aria-hidden>
      <div className="flex items-center gap-3 px-3 py-2.5 md:px-1 md:pt-0">
        <Skeleton className="size-8 rounded-full" />
        <Skeleton className="h-3.5 w-32" />
      </div>
      <Skeleton className="aspect-[4/5] w-full rounded-none md:rounded-[4px]" />
      <div className="flex flex-col gap-2 px-3 pt-3 md:px-1">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-3.5 w-64 max-w-full" />
      </div>
    </div>
  );
}
