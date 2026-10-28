import { Injectable } from "@nestjs/common";
import type { CurrentUser, User, UserPreview } from "@ig/shared";
import type { Prisma } from "../../generated/prisma/client";
import { MediaUrlService } from "../../infra/storage/media-url.service";

/** Prisma include needed to present a user */
export const userPresentationInclude = {
  avatarMedia: { select: { variants: true } },
  links: { orderBy: { position: "asc" }, select: { title: true, url: true } },
} satisfies Prisma.UserInclude;

export type PresentableUser = Prisma.UserGetPayload<{ include: typeof userPresentationInclude }>;

/** Prisma select for list rows (followers, suggestions, search…) */
export const userPreviewSelect = {
  id: true,
  username: true,
  fullName: true,
  isVerified: true,
  avatarMedia: { select: { variants: true } },
} satisfies Prisma.UserSelect;

export type PreviewableUser = Prisma.UserGetPayload<{ select: typeof userPreviewSelect }>;

/** Maps database rows to the API contract from @ig/shared */
@Injectable()
export class UserPresenter {
  constructor(private readonly mediaUrls: MediaUrlService) {}

  toPreview(user: PreviewableUser): UserPreview {
    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      avatar: this.mediaUrls.avatar(user.avatarMedia),
      isVerified: user.isVerified,
    };
  }

  toUser(user: PresentableUser): User {
    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      avatar: this.mediaUrls.avatar(user.avatarMedia),
      bio: user.bio,
      links: user.links,
      isVerified: user.isVerified,
      isPrivate: user.isPrivate,
      followersCount: user.followersCount,
      followingCount: user.followingCount,
      postsCount: user.postsCount,
      createdAt: user.createdAt.toISOString(),
    };
  }

  toCurrentUser(user: PresentableUser): CurrentUser {
    return {
      ...this.toUser(user),
      email: user.email,
      emailVerified: user.emailVerifiedAt !== null,
      language: user.language,
      role: user.role,
    };
  }
}
