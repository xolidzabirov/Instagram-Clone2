"use client";

import Link from "next/link";
import { ROUTES, profileRoute } from "@/shared/config";
import { useTranslations } from "@/shared/i18n";
import { Avatar, Skeleton } from "@/shared/ui";
import { useSession } from "@/entities/session";
import { UserListItem, useSuggestions, type SuggestionItem } from "@/entities/user";
import { FollowButton } from "@/features/follow-user";

function SuggestionSubtitle({ user }: { user: SuggestionItem }) {
  const t = useTranslations("suggestions");
  return <>{user.mutualCount > 0 ? t("mutual", { count: user.mutualCount }) : t("popular")}</>;
}

function SuggestionRow({ user, variant }: { user: SuggestionItem; variant: "link" | "list" }) {
  return (
    <UserListItem
      user={user}
      subtitle={<SuggestionSubtitle user={user} />}
      className={variant === "link" ? "px-0 py-1.5" : undefined}
      action={
        <FollowButton
          variant={variant}
          target={{ id: user.id, username: user.username, avatar: user.avatar }}
          following={user.following ?? false}
          followRequested={user.followRequested ?? false}
        />
      }
    />
  );
}

function RowsSkeleton({ count }: { count: number }) {
  return Array.from({ length: count }, (_, index) => (
    <div key={index} className="flex items-center gap-3 py-1.5" aria-hidden>
      <Skeleton className="size-11 rounded-full" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-36" />
      </div>
    </div>
  ));
}

/** Right column of the home page: you, then "Suggested for you" with Follow links */
export function Suggestions() {
  const t = useTranslations("suggestions");
  const footer = useTranslations("footer");
  const user = useSession();
  const suggestions = useSuggestions(5);

  return (
    <aside className="hidden w-[383px] shrink-0 flex-col pl-16 pt-9 xl:flex">
      {user && (
        <div className="mb-6 flex items-center gap-3">
          <Link href={profileRoute(user.username)} aria-hidden tabIndex={-1}>
            <Avatar src={user.avatar} alt="" size="md" />
          </Link>
          <div className="min-w-0 flex-1 text-sm leading-[18px]">
            <Link href={profileRoute(user.username)} className="block truncate font-semibold hover:opacity-60">
              {user.username}
            </Link>
            <span className="block truncate text-muted">{user.fullName}</span>
          </div>
        </div>
      )}

      {(suggestions.isPending || (suggestions.data?.length ?? 0) > 0) && (
        <section aria-labelledby="suggestions-title">
          <div className="mb-2 flex items-center justify-between">
            <h2 id="suggestions-title" className="text-sm font-semibold text-muted">
              {t("title")}
            </h2>
            <Link href={ROUTES.explorePeople} className="text-xs font-semibold hover:text-muted">
              {t("seeAll")}
            </Link>
          </div>
          {suggestions.isPending ? (
            <RowsSkeleton count={5} />
          ) : (
            <ul>
              {suggestions.data?.map((item) => (
                <li key={item.id}>
                  <SuggestionRow user={item} variant="link" />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <footer className="mt-8 text-xs leading-4 text-muted/70">
        <p>{footer("links").split("|").join(" · ")}</p>
        <p className="mt-4 uppercase">{footer("copyright", { year: 2026 })}</p>
      </footer>
    </aside>
  );
}

/** `/explore/people`: the full list of suggestions with big Follow buttons */
export function SuggestionsList() {
  const t = useTranslations("suggestions");
  const common = useTranslations("common");
  const suggestions = useSuggestions(30);

  return (
    <section className="w-full max-w-[600px] pb-12 pt-4 md:pt-12" aria-labelledby="suggested-page-title">
      <h1 id="suggested-page-title" className="mb-3 px-4 text-base font-bold">
        {t("pageTitle")}
      </h1>
      {suggestions.isPending ? (
        <div className="px-4">
          <RowsSkeleton count={8} />
        </div>
      ) : suggestions.isError ? (
        <p className="px-4 py-10 text-center text-sm text-muted">
          {common("errorDescription")}{" "}
          <button type="button" className="font-semibold text-primary" onClick={() => void suggestions.refetch()}>
            {common("retry")}
          </button>
        </p>
      ) : suggestions.data.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-muted">{t("empty")}</p>
      ) : (
        <ul>
          {suggestions.data.map((item) => (
            <li key={item.id}>
              <SuggestionRow user={item} variant="list" />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
