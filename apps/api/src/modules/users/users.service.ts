import { HttpStatus, Injectable } from "@nestjs/common";
import type { CurrentUser, SuggestedUser, UpdateProfileInput, UserProfile } from "@ig/shared";
import { AppError } from "../../common/errors/app-error";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { PolicyService } from "./policy.service";
import { UserPresenter, userPresentationInclude, userPreviewSelect } from "./user.presenter";

const userNotFound = () => new AppError("USER_NOT_FOUND", "Пользователь не найден", HttpStatus.NOT_FOUND);

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly presenter: UserPresenter,
    private readonly policy: PolicyService
  ) {}

  async getMe(userId: string): Promise<CurrentUser> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: userPresentationInclude,
    });
    return this.presenter.toCurrentUser(user);
  }

  async updateMe(userId: string, input: UpdateProfileInput): Promise<CurrentUser> {
    const { links, isPrivate, ...fields } = input;

    if (fields.username) {
      const owner = await this.prisma.user.findUnique({
        where: { username: fields.username },
        select: { id: true },
      });
      if (owner && owner.id !== userId) {
        throw new AppError("USERNAME_TAKEN", "Это имя пользователя уже занято", HttpStatus.CONFLICT);
      }
    }

    await this.prisma.$transaction(async (tx) => {
      const before = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { isPrivate: true } });

      await tx.user.update({
        where: { id: userId },
        data: { ...fields, ...(isPrivate !== undefined && { isPrivate }) },
      });

      if (links) {
        await tx.userLink.deleteMany({ where: { userId } });
        await tx.userLink.createMany({
          data: links.map((link, position) => ({ userId, position, title: link.title, url: link.url })),
        });
      }

      // Going public accepts every pending follow request, like Instagram does
      if (before.isPrivate && isPrivate === false) {
        const pending = await tx.follow.findMany({
          where: { followingId: userId, status: "PENDING" },
          select: { followerId: true },
        });
        if (pending.length > 0) {
          const followerIds = pending.map((f) => f.followerId);
          await tx.follow.updateMany({
            where: { followingId: userId, status: "PENDING" },
            data: { status: "ACCEPTED" },
          });
          await tx.user.update({
            where: { id: userId },
            data: { followersCount: { increment: followerIds.length } },
          });
          await tx.user.updateMany({
            where: { id: { in: followerIds } },
            data: { followingCount: { increment: 1 } },
          });
        }
      }
    });

    return this.getMe(userId);
  }

  async setAvatar(userId: string, mediaId: string): Promise<CurrentUser> {
    const media = await this.prisma.media.findUnique({ where: { id: mediaId } });
    const usable =
      media?.ownerId === userId &&
      media.type === "IMAGE" &&
      media.purpose === "AVATAR" &&
      media.status === "READY";
    if (!usable) {
      throw new AppError(
        "INVALID_MEDIA",
        "Media must be your own processed avatar image",
        HttpStatus.BAD_REQUEST
      );
    }
    await this.prisma.user.update({ where: { id: userId }, data: { avatarMediaId: mediaId } });
    return this.getMe(userId);
  }

  async removeAvatar(userId: string): Promise<CurrentUser> {
    await this.prisma.user.update({ where: { id: userId }, data: { avatarMediaId: null } });
    return this.getMe(userId);
  }

  async getProfile(username: string, viewerId: string | null): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      include: userPresentationInclude,
    });
    if (!user || user.deletedAt || user.status !== "ACTIVE") throw userNotFound();
    if (await this.policy.isHiddenFrom(viewerId, user.id)) throw userNotFound();

    const isMe = viewerId === user.id;
    const relationship = viewerId && !isMe ? await this.policy.relationship(viewerId, user.id) : null;

    return {
      ...this.presenter.toUser(user),
      isMe,
      canViewContent: this.policy.canViewContent(viewerId, user, relationship),
      relationship,
    };
  }

  /**
   * "Suggested for you": accounts followed by people you follow (most mutuals first),
   * then popular accounts. Excludes yourself, people you follow or requested, and blocks.
   */
  async suggestions(viewerId: string, limit: number): Promise<SuggestedUser[]> {
    const ranked = await this.prisma.$queryRaw<{ id: string; mutual: number }[]>`
      WITH mine AS (
        SELECT "followingId" AS id FROM follows
        WHERE "followerId" = ${viewerId}::uuid AND status = 'ACCEPTED'
      ),
      mutuals AS (
        SELECT f."followingId" AS id, count(*)::int AS mutual
        FROM follows f JOIN mine ON mine.id = f."followerId"
        WHERE f.status = 'ACCEPTED'
        GROUP BY f."followingId"
      )
      SELECT u.id, coalesce(m.mutual, 0)::int AS mutual
      FROM users u
      LEFT JOIN mutuals m ON m.id = u.id
      WHERE u.id <> ${viewerId}::uuid
        AND u.status = 'ACTIVE' AND u."deletedAt" IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM follows f WHERE f."followerId" = ${viewerId}::uuid AND f."followingId" = u.id
        )
        AND NOT EXISTS (
          SELECT 1 FROM blocks b
          WHERE (b."blockerId" = ${viewerId}::uuid AND b."blockedId" = u.id)
             OR (b."blockerId" = u.id AND b."blockedId" = ${viewerId}::uuid)
        )
      ORDER BY mutual DESC, u."followersCount" DESC, u.id
      LIMIT ${limit}`;

    const users = await this.prisma.user.findMany({
      where: { id: { in: ranked.map((row) => row.id) } },
      select: userPreviewSelect,
    });
    const byId = new Map(users.map((user) => [user.id, user]));
    return ranked.flatMap((row) => {
      const user = byId.get(row.id);
      return user ? [{ ...this.presenter.toPreview(user), mutualCount: row.mutual }] : [];
    });
  }
}
