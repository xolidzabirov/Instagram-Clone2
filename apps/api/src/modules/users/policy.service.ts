import { Injectable } from "@nestjs/common";
import type { Relationship } from "@ig/shared";
import { PrismaService } from "../../infra/prisma/prisma.service";

interface Owner {
  id: string;
  isPrivate: boolean;
}

/**
 * Single source of truth for "who may see what".
 * Every listing (profiles, feed, search, explore, comments) must go through it.
 */
@Injectable()
export class PolicyService {
  constructor(private readonly prisma: PrismaService) {}

  /** True when the owner blocked the viewer: the owner's account must look nonexistent */
  async isHiddenFrom(viewerId: string | null, ownerId: string): Promise<boolean> {
    if (!viewerId || viewerId === ownerId) return false;
    const block = await this.prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId: ownerId, blockedId: viewerId } },
      select: { blockerId: true },
    });
    return block !== null;
  }

  async relationship(viewerId: string, ownerId: string): Promise<Relationship> {
    const [outgoing, incoming, blocking, closeFriend] = await Promise.all([
      this.prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: viewerId, followingId: ownerId } },
      }),
      this.prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: ownerId, followingId: viewerId } },
        select: { status: true },
      }),
      this.prisma.block.findUnique({
        where: { blockerId_blockedId: { blockerId: viewerId, blockedId: ownerId } },
        select: { blockerId: true },
      }),
      this.prisma.closeFriend.findUnique({
        where: { ownerId_friendId: { ownerId: viewerId, friendId: ownerId } },
        select: { ownerId: true },
      }),
    ]);

    return {
      following: outgoing?.status === "ACCEPTED",
      followRequested: outgoing?.status === "PENDING",
      followedBy: incoming?.status === "ACCEPTED",
      blocking: blocking !== null,
      isCloseFriend: closeFriend !== null,
      isFavorite: outgoing?.isFavorite ?? false,
      mutedPosts: outgoing?.mutedPosts ?? false,
      mutedStories: outgoing?.mutedStories ?? false,
    };
  }

  /** Posts, reels, stories and follower lists of the owner */
  canViewContent(viewerId: string | null, owner: Owner, relationship: Relationship | null): boolean {
    if (viewerId === owner.id) return true;
    if (relationship?.blocking) return false;
    if (!owner.isPrivate) return true;
    return relationship?.following ?? false;
  }
}
