import type { Prisma } from "../../generated/prisma/client";

type Tx = Prisma.TransactionClient;

/** Applies the counter changes of an accepted follow appearing (+1) or disappearing (-1) */
export async function adjustFollowCounters(tx: Tx, followerId: string, followingId: string, delta: 1 | -1) {
  await tx.user.update({ where: { id: followerId }, data: { followingCount: { increment: delta } } });
  await tx.user.update({ where: { id: followingId }, data: { followersCount: { increment: delta } } });
}

/**
 * Deletes a follow (accepted or pending) and fixes counters.
 * The conditional delete makes it safe against concurrent removals.
 */
export async function removeFollow(tx: Tx, followerId: string, followingId: string): Promise<boolean> {
  const existing = await tx.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
    select: { status: true },
  });
  if (!existing) return false;

  const { count } = await tx.follow.deleteMany({
    where: { followerId, followingId, status: existing.status },
  });
  if (count === 1 && existing.status === "ACCEPTED") {
    await adjustFollowCounters(tx, followerId, followingId, -1);
  }
  return count === 1;
}
