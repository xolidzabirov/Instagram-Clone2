import { HttpStatus, Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import type {
  FollowListItem,
  FollowRequest,
  FollowStatus,
  Paginated,
  PaginationInput,
  SearchablePaginationInput,
} from "@ig/shared";
import { DomainEvents, type FollowEvent } from "../../common/events/events";
import { AppError } from "../../common/errors/app-error";
import { decodeCursor, toPage } from "../../common/pagination/cursor";
import { Prisma } from "../../generated/prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { PolicyService } from "../users/policy.service";
import { UserPresenter, userPreviewSelect } from "../users/user.presenter";
import { adjustFollowCounters, removeFollow } from "./follow-graph";
import { TargetUsers } from "../users/target-users";

@Injectable()
export class FollowsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: PolicyService,
    private readonly presenter: UserPresenter,
    private readonly targets: TargetUsers,
    private readonly events: EventEmitter2
  ) {}

  async follow(viewerId: string, targetId: string): Promise<{ status: FollowStatus }> {
    if (viewerId === targetId) {
      throw new AppError("CANNOT_FOLLOW_SELF", "You cannot follow yourself", HttpStatus.BAD_REQUEST);
    }
    const target = await this.targets.visibleTo(viewerId, targetId);
    if (await this.targets.hasBlocked(viewerId, targetId)) {
      throw new AppError("USER_BLOCKED", "Unblock this user to follow them", HttpStatus.CONFLICT);
    }

    const existing = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: viewerId, followingId: targetId } },
      select: { status: true },
    });
    if (existing) return { status: existing.status };

    const status: FollowStatus = target.isPrivate ? "PENDING" : "ACCEPTED";
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.follow.create({ data: { followerId: viewerId, followingId: targetId, status } });
        if (status === "ACCEPTED") await adjustFollowCounters(tx, viewerId, targetId, 1);
      });
    } catch (error) {
      // A concurrent request created the follow first: report what exists
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const current = await this.prisma.follow.findUniqueOrThrow({
          where: { followerId_followingId: { followerId: viewerId, followingId: targetId } },
        });
        return { status: current.status };
      }
      throw error;
    }

    const event: FollowEvent = { followerId: viewerId, followingId: targetId };
    this.events.emit(status === "ACCEPTED" ? DomainEvents.UserFollowed : DomainEvents.FollowRequested, event);
    return { status };
  }

  /** Unfollows, or cancels a pending request */
  async unfollow(viewerId: string, targetId: string): Promise<void> {
    await this.prisma.$transaction((tx) => removeFollow(tx, viewerId, targetId));
  }

  async removeFollower(ownerId: string, followerId: string): Promise<void> {
    const removed = await this.prisma.$transaction((tx) => removeFollow(tx, followerId, ownerId));
    if (!removed) {
      throw new AppError("NOT_A_FOLLOWER", "This user does not follow you", HttpStatus.NOT_FOUND);
    }
  }

  async listRequests(ownerId: string, page: PaginationInput): Promise<Paginated<FollowRequest>> {
    const cursor = decodeCursor(page.cursor);
    const rows = await this.prisma.follow.findMany({
      where: {
        followingId: ownerId,
        status: "PENDING",
        ...(cursor && {
          OR: [
            { createdAt: { lt: cursor.createdAt } },
            { createdAt: cursor.createdAt, followerId: { lt: cursor.id } },
          ],
        }),
      },
      orderBy: [{ createdAt: "desc" }, { followerId: "desc" }],
      take: page.limit + 1,
      include: { follower: { select: userPreviewSelect } },
    });
    return toPage(
      rows,
      page.limit,
      (row) => ({ createdAt: row.createdAt, id: row.followerId }),
      (pageRows) =>
        pageRows.map((row) => ({
          user: this.presenter.toPreview(row.follower),
          createdAt: row.createdAt.toISOString(),
        }))
    );
  }

  async acceptRequest(ownerId: string, followerId: string): Promise<void> {
    const accepted = await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.follow.updateMany({
        where: { followerId, followingId: ownerId, status: "PENDING" },
        data: { status: "ACCEPTED" },
      });
      if (count === 1) await adjustFollowCounters(tx, followerId, ownerId, 1);
      return count === 1;
    });
    if (!accepted) {
      throw new AppError("REQUEST_NOT_FOUND", "Follow request not found", HttpStatus.NOT_FOUND);
    }
    const event: FollowEvent = { followerId, followingId: ownerId };
    this.events.emit(DomainEvents.FollowAccepted, event);
  }

  async declineRequest(ownerId: string, followerId: string): Promise<void> {
    const { count } = await this.prisma.follow.deleteMany({
      where: { followerId, followingId: ownerId, status: "PENDING" },
    });
    if (count === 0) {
      throw new AppError("REQUEST_NOT_FOUND", "Follow request not found", HttpStatus.NOT_FOUND);
    }
  }

  followers(username: string, viewerId: string, query: SearchablePaginationInput) {
    return this.list(username, viewerId, query, "followers");
  }

  following(username: string, viewerId: string, query: SearchablePaginationInput) {
    return this.list(username, viewerId, query, "following");
  }

  private async list(
    username: string,
    viewerId: string,
    query: SearchablePaginationInput,
    direction: "followers" | "following"
  ): Promise<Paginated<FollowListItem>> {
    const owner = await this.targets.byUsername(viewerId, username);
    const relationship = viewerId === owner.id ? null : await this.policy.relationship(viewerId, owner.id);
    if (!this.policy.canViewContent(viewerId, owner, relationship)) {
      throw new AppError("PRIVATE_ACCOUNT", "This account is private", HttpStatus.FORBIDDEN);
    }

    const personFilter: Prisma.UserWhereInput = {
      status: "ACTIVE",
      deletedAt: null,
      // People the viewer blocked, or who blocked the viewer, are left out of lists
      blocking: { none: { blockedId: viewerId } },
      blockedBy: { none: { blockerId: viewerId } },
      ...(query.q && {
        OR: [
          { username: { contains: query.q.toLowerCase() } },
          { fullName: { contains: query.q, mode: "insensitive" } },
        ],
      }),
    };
    const cursor = decodeCursor(query.cursor);
    const page = { orderBy: [{ createdAt: "desc" as const }], take: query.limit + 1 };

    const rows =
      direction === "followers"
        ? (
            await this.prisma.follow.findMany({
              ...page,
              orderBy: [...page.orderBy, { followerId: "desc" }],
              where: {
                followingId: owner.id,
                status: "ACCEPTED",
                follower: personFilter,
                ...(cursor && {
                  OR: [
                    { createdAt: { lt: cursor.createdAt } },
                    { createdAt: cursor.createdAt, followerId: { lt: cursor.id } },
                  ],
                }),
              },
              select: { createdAt: true, follower: { select: userPreviewSelect } },
            })
          ).map((row) => ({ createdAt: row.createdAt, person: row.follower }))
        : (
            await this.prisma.follow.findMany({
              ...page,
              orderBy: [...page.orderBy, { followingId: "desc" }],
              where: {
                followerId: owner.id,
                status: "ACCEPTED",
                following: personFilter,
                ...(cursor && {
                  OR: [
                    { createdAt: { lt: cursor.createdAt } },
                    { createdAt: cursor.createdAt, followingId: { lt: cursor.id } },
                  ],
                }),
              },
              select: { createdAt: true, following: { select: userPreviewSelect } },
            })
          ).map((row) => ({ createdAt: row.createdAt, person: row.following }));

    const statusById = await this.policy.followStatuses(viewerId, rows.map((row) => row.person.id));

    return toPage(
      rows,
      query.limit,
      (row) => ({ createdAt: row.createdAt, id: row.person.id }),
      (pageRows) =>
        pageRows.map(({ person }) => ({
          ...this.presenter.toPreview(person),
          isMe: person.id === viewerId,
          following: statusById.get(person.id) === "ACCEPTED",
          followRequested: statusById.get(person.id) === "PENDING",
        }))
    );
  }
}
