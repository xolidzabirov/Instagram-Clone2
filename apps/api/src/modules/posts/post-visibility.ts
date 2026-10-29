import type { Prisma } from "../../generated/prisma/client";

/**
 * Authors whose posts the viewer may see: active accounts, no block in either direction,
 * and either public, the viewer themself, or followed by the viewer.
 * Used by every post listing (grids, tags, feed, explore, hashtags).
 */
export function visibleAuthorWhere(viewerId: string | null): Prisma.UserWhereInput {
  if (!viewerId) return { status: "ACTIVE", deletedAt: null, isPrivate: false };
  return {
    status: "ACTIVE",
    deletedAt: null,
    blocking: { none: { blockedId: viewerId } },
    blockedBy: { none: { blockerId: viewerId } },
    OR: [
      { isPrivate: false },
      { id: viewerId },
      { followers: { some: { followerId: viewerId, status: "ACCEPTED" } } },
    ],
  };
}

/** Published posts: not deleted and not archived */
export const publishedPostWhere = { deletedAt: null, isArchived: false } satisfies Prisma.PostWhereInput;
