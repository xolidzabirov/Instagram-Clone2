import { extractHashtags, extractMentions } from "@ig/shared";
import type { Prisma } from "../../generated/prisma/client";

type Tx = Prisma.TransactionClient;

/**
 * Keeps hashtags, topics and mentions of a post in sync with its caption.
 * Runs inside the transaction that writes the post. Returns users mentioned for the first time.
 */
export async function indexCaption(
  tx: Tx,
  post: { id: string; authorId: string; caption: string }
): Promise<string[]> {
  await syncHashtags(tx, post.id, extractHashtags(post.caption));
  await syncTopics(tx, post.id);
  return syncMentions(tx, post, extractMentions(post.caption));
}

/** Removes everything the caption contributed (used when a post is deleted) */
export async function unindexCaption(tx: Tx, postId: string): Promise<void> {
  await syncHashtags(tx, postId, []);
  await tx.postTopic.deleteMany({ where: { postId } });
  await tx.mention.deleteMany({ where: { sourceType: "POST", sourceId: postId } });
}

async function syncHashtags(tx: Tx, postId: string, names: string[]) {
  const current = await tx.postHashtag.findMany({
    where: { postId },
    select: { hashtagId: true, hashtag: { select: { name: true } } },
  });
  const currentNames = new Set(current.map((row) => row.hashtag.name));
  const wanted = new Set(names);

  const removedIds = current.filter((row) => !wanted.has(row.hashtag.name)).map((row) => row.hashtagId);
  if (removedIds.length > 0) {
    await tx.postHashtag.deleteMany({ where: { postId, hashtagId: { in: removedIds } } });
    await tx.hashtag.updateMany({ where: { id: { in: removedIds } }, data: { postsCount: { decrement: 1 } } });
  }

  const added = names.filter((name) => !currentNames.has(name));
  if (added.length > 0) {
    await tx.hashtag.createMany({ data: added.map((name) => ({ name })), skipDuplicates: true });
    const hashtags = await tx.hashtag.findMany({ where: { name: { in: added } }, select: { id: true } });
    await tx.postHashtag.createMany({ data: hashtags.map((h) => ({ postId, hashtagId: h.id })) });
    await tx.hashtag.updateMany({
      where: { id: { in: hashtags.map((h) => h.id) } },
      data: { postsCount: { increment: 1 } },
    });
  }
}

/** Topics («Ваш алгоритм») come from the dictionary mapping hashtags to topics */
async function syncTopics(tx: Tx, postId: string) {
  await tx.postTopic.deleteMany({ where: { postId } });
  const topics = await tx.hashtagTopic.findMany({
    where: { hashtag: { posts: { some: { postId } } } },
    select: { topicId: true },
    distinct: ["topicId"],
  });
  if (topics.length > 0) {
    await tx.postTopic.createMany({ data: topics.map((t) => ({ postId, topicId: t.topicId })) });
  }
}

async function syncMentions(
  tx: Tx,
  post: { id: string; authorId: string },
  usernames: string[]
): Promise<string[]> {
  const users = usernames.length
    ? await tx.user.findMany({
        where: {
          username: { in: usernames },
          status: "ACTIVE",
          deletedAt: null,
          // People who blocked the author, or whom the author blocked, are not linked
          blocking: { none: { blockedId: post.authorId } },
          blockedBy: { none: { blockerId: post.authorId } },
        },
        select: { id: true },
      })
    : [];
  const wanted = new Set(users.map((u) => u.id).filter((id) => id !== post.authorId));

  const existing = await tx.mention.findMany({
    where: { sourceType: "POST", sourceId: post.id },
    select: { mentionedUserId: true },
  });
  const existingIds = new Set(existing.map((m) => m.mentionedUserId));

  const removed = [...existingIds].filter((id) => !wanted.has(id));
  if (removed.length > 0) {
    await tx.mention.deleteMany({
      where: { sourceType: "POST", sourceId: post.id, mentionedUserId: { in: removed } },
    });
  }

  const added = [...wanted].filter((id) => !existingIds.has(id));
  if (added.length > 0) {
    await tx.mention.createMany({
      data: added.map((mentionedUserId) => ({ sourceType: "POST" as const, sourceId: post.id, mentionedUserId })),
    });
  }
  return added;
}
