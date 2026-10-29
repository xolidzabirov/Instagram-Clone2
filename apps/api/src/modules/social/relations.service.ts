import { HttpStatus, Injectable } from "@nestjs/common";
import type {
  Paginated,
  PaginationInput,
  Relationship,
  RelationshipUpdateInput,
  UserPreview,
} from "@ig/shared";
import { AppError } from "../../common/errors/app-error";
import { decodeCursor, toPage, type Cursor } from "../../common/pagination/cursor";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { PolicyService } from "../users/policy.service";
import { UserPresenter, userPreviewSelect, type PreviewableUser } from "../users/user.presenter";
import { removeFollow } from "./follow-graph";
import { TargetUsers } from "../users/target-users";

const cannotTargetSelf = () =>
  new AppError("CANNOT_TARGET_SELF", "This action cannot target yourself", HttpStatus.BAD_REQUEST);

/** Keyset condition on a (createdAt, <id field>) ordering */
function after<F extends string>(cursor: Cursor | null, idField: F) {
  return cursor
    ? { OR: [{ createdAt: { lt: cursor.createdAt } }, { createdAt: cursor.createdAt, [idField]: { lt: cursor.id } }] }
    : {};
}

@Injectable()
export class RelationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: PolicyService,
    private readonly presenter: UserPresenter,
    private readonly targets: TargetUsers
  ) {}

  /** Blocking removes follows in both directions and close-friend entries */
  async block(viewerId: string, targetId: string): Promise<void> {
    if (viewerId === targetId) throw cannotTargetSelf();
    await this.targets.exists(targetId);

    await this.prisma.$transaction(async (tx) => {
      await tx.block.createMany({
        data: [{ blockerId: viewerId, blockedId: targetId }],
        skipDuplicates: true,
      });
      await removeFollow(tx, viewerId, targetId);
      await removeFollow(tx, targetId, viewerId);
      await tx.closeFriend.deleteMany({
        where: {
          OR: [
            { ownerId: viewerId, friendId: targetId },
            { ownerId: targetId, friendId: viewerId },
          ],
        },
      });
    });
  }

  async unblock(viewerId: string, targetId: string): Promise<void> {
    await this.prisma.block.deleteMany({ where: { blockerId: viewerId, blockedId: targetId } });
  }

  async restrict(viewerId: string, targetId: string): Promise<void> {
    if (viewerId === targetId) throw cannotTargetSelf();
    await this.targets.visibleTo(viewerId, targetId);
    await this.prisma.restrict.createMany({
      data: [{ ownerId: viewerId, restrictedId: targetId }],
      skipDuplicates: true,
    });
  }

  async unrestrict(viewerId: string, targetId: string): Promise<void> {
    await this.prisma.restrict.deleteMany({ where: { ownerId: viewerId, restrictedId: targetId } });
  }

  /** Favorites and mutes are settings of an accepted follow */
  async updateRelationship(
    viewerId: string,
    targetId: string,
    input: RelationshipUpdateInput
  ): Promise<Relationship> {
    await this.targets.visibleTo(viewerId, targetId);
    const { count } = await this.prisma.follow.updateMany({
      where: { followerId: viewerId, followingId: targetId, status: "ACCEPTED" },
      data: input,
    });
    if (count === 0) {
      throw new AppError("NOT_FOLLOWING", "Follow this user first", HttpStatus.CONFLICT);
    }
    return this.policy.relationship(viewerId, targetId);
  }

  async addCloseFriend(viewerId: string, friendId: string): Promise<void> {
    if (viewerId === friendId) throw cannotTargetSelf();
    await this.targets.visibleTo(viewerId, friendId);
    if (await this.targets.hasBlocked(viewerId, friendId)) {
      throw new AppError("USER_BLOCKED", "Unblock this user first", HttpStatus.CONFLICT);
    }
    await this.prisma.closeFriend.createMany({
      data: [{ ownerId: viewerId, friendId }],
      skipDuplicates: true,
    });
  }

  async removeCloseFriend(viewerId: string, friendId: string): Promise<void> {
    await this.prisma.closeFriend.deleteMany({ where: { ownerId: viewerId, friendId } });
  }

  async closeFriends(viewerId: string, page: PaginationInput): Promise<Paginated<UserPreview>> {
    const cursor = decodeCursor(page.cursor);
    const rows = await this.prisma.closeFriend.findMany({
      where: { ownerId: viewerId, ...after(cursor, "friendId") },
      orderBy: [{ createdAt: "desc" }, { friendId: "desc" }],
      take: page.limit + 1,
      select: { createdAt: true, friend: { select: userPreviewSelect } },
    });
    return this.page(rows.map((r) => ({ createdAt: r.createdAt, user: r.friend })), page.limit);
  }

  async blocked(viewerId: string, page: PaginationInput): Promise<Paginated<UserPreview>> {
    const cursor = decodeCursor(page.cursor);
    const rows = await this.prisma.block.findMany({
      where: { blockerId: viewerId, ...after(cursor, "blockedId") },
      orderBy: [{ createdAt: "desc" }, { blockedId: "desc" }],
      take: page.limit + 1,
      select: { createdAt: true, blocked: { select: userPreviewSelect } },
    });
    return this.page(rows.map((r) => ({ createdAt: r.createdAt, user: r.blocked })), page.limit);
  }

  async restricted(viewerId: string, page: PaginationInput): Promise<Paginated<UserPreview>> {
    const cursor = decodeCursor(page.cursor);
    const rows = await this.prisma.restrict.findMany({
      where: { ownerId: viewerId, ...after(cursor, "restrictedId") },
      orderBy: [{ createdAt: "desc" }, { restrictedId: "desc" }],
      take: page.limit + 1,
      select: { createdAt: true, restricted: { select: userPreviewSelect } },
    });
    return this.page(rows.map((r) => ({ createdAt: r.createdAt, user: r.restricted })), page.limit);
  }

  async muted(viewerId: string, page: PaginationInput): Promise<Paginated<UserPreview>> {
    const cursor = decodeCursor(page.cursor);
    const rows = await this.prisma.follow.findMany({
      where: {
        followerId: viewerId,
        OR: [{ mutedPosts: true }, { mutedStories: true }],
        ...(cursor && {
          AND: [
            {
              OR: [
                { createdAt: { lt: cursor.createdAt } },
                { createdAt: cursor.createdAt, followingId: { lt: cursor.id } },
              ],
            },
          ],
        }),
      },
      orderBy: [{ createdAt: "desc" }, { followingId: "desc" }],
      take: page.limit + 1,
      select: { createdAt: true, following: { select: userPreviewSelect } },
    });
    return this.page(rows.map((r) => ({ createdAt: r.createdAt, user: r.following })), page.limit);
  }

  private page(rows: { createdAt: Date; user: PreviewableUser }[], limit: number) {
    return toPage(
      rows,
      limit,
      (row) => ({ createdAt: row.createdAt, id: row.user.id }),
      (pageRows) => pageRows.map((row) => this.presenter.toPreview(row.user))
    );
  }
}
