"use client";

import type { UserProfile } from "@ig/shared";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ROUTES } from "@/shared/config";
import { useFormatCount, useTranslations } from "@/shared/i18n";
import {
  AddUserIcon,
  Avatar,
  Button,
  ButtonLink,
  IconButton,
  LinkIcon,
  MoreIcon,
  SettingsIcon,
  VerifiedBadge,
} from "@/shared/ui";
import type { FollowListKind } from "@/entities/user";
import { ProfileOptionsDialog } from "@/features/block-user";
import { FollowButton } from "@/features/follow-user";
import { AvatarPicker } from "@/features/edit-profile";

interface ProfileHeaderProps {
  profile: UserProfile;
  /** Opens the followers / following dialog; omitted when the lists are hidden (private account) */
  onOpenList?: (kind: FollowListKind) => void;
}

function displayUrl(url: string) {
  return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}

export function ProfileHeader({ profile, onOpenList }: ProfileHeaderProps) {
  const t = useTranslations("profile");
  const common = useTranslations("common");
  const relationshipT = useTranslations("relationship");
  const formatCount = useFormatCount();
  const [options, setOptions] = useState<"menu" | "unblock" | null>(null);

  const relationship = profile.relationship;
  const blocking = relationship?.blocking ?? false;
  const target = { id: profile.id, username: profile.username, avatar: profile.avatar, isPrivate: profile.isPrivate };

  const stat = (key: "posts" | "followers" | "following", count: number, kind?: FollowListKind) => {
    const content = t.rich(key, {
      count,
      value: formatCount(count),
      b: (chunks) => <span className="font-semibold text-foreground">{chunks}</span>,
    });
    return (
      // Phones stack the number above the label, like the app
      <li className="max-md:flex max-md:flex-1 max-md:flex-col max-md:items-center max-md:leading-[18px]">
        {kind && onOpenList ? (
          <button type="button" onClick={() => onOpenList(kind)} className="hover:opacity-70 max-md:flex max-md:w-full max-md:flex-col max-md:items-center">
            {content}
          </button>
        ) : (
          content
        )}
      </li>
    );
  };

  const avatar = (size: "xl" | "2xl") =>
    profile.isMe ? (
      <AvatarPicker hasAvatar={Boolean(profile.avatar)}>
        {({ onClick, disabled }) => (
          <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={t("changePhoto")}
            title={t("changePhoto")}
            className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Avatar src={profile.avatar} alt="" size={size} />
          </button>
        )}
      </AvatarPicker>
    ) : (
      <Avatar src={profile.avatar} alt={profile.username} size={size} />
    );

  const actions: ReactNode = profile.isMe ? (
    <>
      <ButtonLink href={ROUTES.editProfile} variant="secondary" className="max-md:flex-1">
        {t("editProfile")}
      </ButtonLink>
      <Button variant="secondary" className="max-md:flex-1" disabled>
        {t("viewArchive")}
      </Button>
    </>
  ) : blocking ? (
    <Button className="max-md:flex-1" onClick={() => setOptions("unblock")}>
      {relationshipT("unblock")}
    </Button>
  ) : (
    <>
      <FollowButton
        variant="profile"
        target={target}
        following={relationship?.following ?? false}
        followRequested={relationship?.followRequested ?? false}
        followedBy={relationship?.followedBy ?? false}
        relationship={relationship ?? undefined}
        className="max-md:flex-1"
      />
      <ButtonLink href={ROUTES.direct} variant="secondary" className="max-md:flex-1">
        {t("message")}
      </ButtonLink>
      <ButtonLink
        href={ROUTES.explorePeople}
        variant="secondary"
        className="px-2.5"
        aria-label={t("similarAccounts")}
        title={t("similarAccounts")}
      >
        <AddUserIcon className="size-4" />
      </ButtonLink>
    </>
  );

  const bio = (
    <div className="text-sm leading-[18px]">
      {profile.fullName && <p className="font-semibold">{profile.fullName}</p>}
      {profile.bio && <p className="whitespace-pre-line break-words">{profile.bio}</p>}
      {profile.links.map((link) => (
        <a
          key={link.url}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="mt-0.5 flex items-center gap-1 font-semibold text-link hover:underline"
        >
          <LinkIcon className="size-3.5 shrink-0 -rotate-45" />
          <span className="truncate">{link.title || displayUrl(link.url)}</span>
        </a>
      ))}
    </div>
  );

  return (
    <header className="flex flex-col gap-4 px-4 pt-4 md:mb-11 md:flex-row md:items-start md:gap-0 md:px-0 md:pt-0">
      <div className="flex shrink-0 items-center gap-7 md:w-[283px] md:justify-center md:pr-7">
        <div className="md:hidden">{avatar("xl")}</div>
        <div className="max-md:hidden">{avatar("2xl")}</div>

        {/* Phones: name and counters sit next to the avatar */}
        <div className="flex min-w-0 flex-1 flex-col gap-2 md:hidden">
          <div className="flex items-center gap-1">
            <h1 className="flex min-w-0 items-center gap-1 text-xl">
              <span className="truncate">{profile.username}</span>
              {profile.isVerified && <VerifiedBadge label={common("verified")} className="text-lg" />}
            </h1>
            {!profile.isMe && (
              <IconButton aria-label={t("options")} className="-my-2 ml-auto" onClick={() => setOptions("menu")}>
                <MoreIcon className="size-6" />
              </IconButton>
            )}
          </div>
          <ul className="flex text-sm text-foreground">
            {stat("posts", profile.postsCount)}
            {stat("followers", profile.followersCount, "followers")}
            {stat("following", profile.followingCount, "following")}
          </ul>
        </div>
      </div>

      <section className="flex min-w-0 flex-1 flex-col gap-4 md:gap-5">
        <div className="flex items-center gap-2 max-md:hidden">
          <h1 className="flex items-center gap-1 text-xl">
            <span className="truncate">{profile.username}</span>
            {profile.isVerified && <VerifiedBadge label={common("verified")} className="text-lg" />}
          </h1>
          {profile.isMe ? (
            <Link
              href={ROUTES.editProfile}
              aria-label={t("editProfile")}
              title={t("editProfile")}
              className="ml-1 rounded-full p-2 transition-opacity hover:opacity-60 focus-visible:outline-2 focus-visible:outline-primary"
            >
              <SettingsIcon className="size-6" />
            </Link>
          ) : (
            <IconButton aria-label={t("options")} className="ml-1" onClick={() => setOptions("menu")}>
              <MoreIcon className="size-6" />
            </IconButton>
          )}
        </div>

        <ul className="flex gap-10 text-base text-foreground max-md:hidden">
          {stat("posts", profile.postsCount)}
          {stat("followers", profile.followersCount, "followers")}
          {stat("following", profile.followingCount, "following")}
        </ul>

        {bio}

        <div className="flex min-w-0 gap-2 [&>*]:min-w-0">{actions}</div>
      </section>

      {options && (
        <ProfileOptionsDialog
          target={target}
          blocking={blocking}
          confirmOnly={options === "unblock"}
          onClose={() => setOptions(null)}
        />
      )}
    </header>
  );
}
