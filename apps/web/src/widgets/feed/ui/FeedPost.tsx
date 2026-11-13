"use client";

import type { FeedItem, Post } from "@ig/shared";
import { useState } from "react";
import { useTranslations } from "@/shared/i18n";
import { MoreIcon } from "@/shared/ui";
import { useSession } from "@/entities/session";
import { PostCard } from "@/entities/post";
import { LikeButton, useLikePost } from "@/features/like-post";
import { RepostButton } from "@/features/repost-post";
import { SaveButton } from "@/features/save-post";
import { ShareButton } from "@/features/share-post";
import { PostOptionsDialog } from "./PostOptionsDialog";

interface FeedPostProps {
  post: Post & Partial<Pick<FeedItem, "isSuggested">>;
  priority?: boolean;
}

/** A post card with every action wired: like, repost, share, save and the "…" menu */
export function FeedPost({ post, priority }: FeedPostProps) {
  const t = useTranslations("post");
  const viewer = useSession();
  const like = useLikePost(post);
  const [menuOpen, setMenuOpen] = useState(false);
  const isOwn = viewer?.id === post.author.id;

  return (
    <>
      <PostCard
        post={post}
        priority={priority}
        onDoubleTap={like.like}
        likeSlot={<LikeButton isLiked={post.isLiked} onToggle={like.toggle} />}
        repostSlot={isOwn ? null : <RepostButton post={post} />}
        shareSlot={<ShareButton postId={post.id} />}
        saveSlot={<SaveButton post={post} />}
        menuSlot={
          <button
            type="button"
            aria-label={t("options")}
            onClick={() => setMenuOpen(true)}
            className="-mr-2 rounded-full p-2 transition-opacity hover:opacity-60"
          >
            <MoreIcon className="size-6" />
          </button>
        }
      />
      {menuOpen && <PostOptionsDialog post={post} isOwn={isOwn} onClose={() => setMenuOpen(false)} />}
    </>
  );
}
