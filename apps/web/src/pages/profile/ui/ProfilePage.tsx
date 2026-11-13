"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ApiError } from "@/shared/api";
import { ROUTES, type ProfileTab } from "@/shared/config";
import { useTranslations } from "@/shared/i18n";
import { Button, EmptyState, LockIcon } from "@/shared/ui";
import { useProfile, type FollowListKind } from "@/entities/user";
import { FollowListModal } from "@/widgets/follow-list";
import { ProfileHeader } from "@/widgets/profile-header";
import { ProfileGrid, ProfileTabs } from "@/widgets/profile-tabs";
import { ProfileFallback } from "./ProfileFallback";

function NotFound() {
  const t = useTranslations("profile");
  return (
    <div className="flex flex-col items-center gap-6 px-6 pt-10 text-center md:pt-20">
      <h1 className="text-2xl font-bold">{t("notFoundTitle")}</h1>
      <p className="text-base">
        {t("notFoundText")}{" "}
        <Link href={ROUTES.home} className="text-link hover:underline">
          {t("backHome")}
        </Link>
      </p>
    </div>
  );
}

/** `/{username}` and its tabs; the username comes from the URL */
export function ProfilePage({ tab = "posts" }: { tab?: ProfileTab }) {
  const params = useParams<{ username: string }>();
  const username = decodeURIComponent(params?.username ?? "");
  const t = useTranslations("profile");
  const relationshipT = useTranslations("relationship");
  const common = useTranslations("common");
  const profile = useProfile(username);
  const [list, setList] = useState<FollowListKind | null>(null);

  if (profile.isPending) {
    return <ProfileFallback />;
  }

  if (profile.isError) {
    if (profile.error instanceof ApiError && profile.error.status === 404) return <NotFound />;
    return (
      <EmptyState
        title={common("errorTitle")}
        description={common("errorDescription")}
        action={
          <Button variant="secondary" size="sm" onClick={() => void profile.refetch()}>
            {common("retry")}
          </Button>
        }
      />
    );
  }

  const data = profile.data;
  const blocking = data.relationship?.blocking ?? false;
  // Saved is private to the owner: anyone else opening /{username}/saved sees the posts tab
  const activeTab: ProfileTab = tab === "saved" && !data.isMe ? "posts" : tab;

  return (
    <div className="w-full max-w-[975px] pb-12 md:px-5 md:pt-[30px]">
      {/* React hoists <title> into <head> */}
      <title>{`${data.fullName ? `${data.fullName} (@${data.username})` : `@${data.username}`} • Instagram`}</title>
      <ProfileHeader profile={data} onOpenList={data.canViewContent && !blocking ? setList : undefined} />

      {blocking ? (
        <div className="mt-4 border-t border-separator">
          <EmptyState title={relationshipT("youBlocked")} />
        </div>
      ) : data.canViewContent ? (
        <div className="mt-4 md:mt-0">
          <ProfileTabs username={data.username} active={activeTab} isMe={data.isMe} />
          <ProfileGrid key={activeTab} username={data.username} tab={activeTab} isMe={data.isMe} />
        </div>
      ) : (
        <div className="mt-4 border-t border-separator md:mx-auto md:mt-0 md:max-w-[935px]">
          <div className="flex items-center gap-4 px-4 py-6 md:justify-center md:py-10">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-foreground">
              <LockIcon className="size-6" />
            </span>
            <div className="text-sm">
              <h2 className="font-semibold">{t("privateTitle")}</h2>
              <p className="text-muted">{t("privateText")}</p>
            </div>
          </div>
        </div>
      )}

      {list && (
        <FollowListModal kind={list} username={data.username} isMe={data.isMe} onClose={() => setList(null)} />
      )}
    </div>
  );
}
