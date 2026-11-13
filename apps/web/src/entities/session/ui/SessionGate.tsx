"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { ROUTES } from "@/shared/config";
import { LogoMark } from "@/shared/ui";
import { refreshSession, useSessionStore } from "../model/session";

/**
 * Wraps signed-in pages. On first load it restores the session from the refresh cookie and
 * shows Instagram's splash meanwhile; if the session is gone it sends the visitor to log in.
 * (proxy.ts already redirects visitors without any session before the page renders.)
 */
export function SessionGate({ children }: { children: ReactNode }) {
  const status = useSessionStore((state) => state.status);
  const router = useRouter();

  useEffect(() => {
    if (useSessionStore.getState().status === "loading") void refreshSession();
  }, []);

  useEffect(() => {
    if (status !== "guest") return;
    // Read in the effect, not with usePathname(): that hook would make the layout wait for the
    // URL of dynamic routes like /{username} and drop it from the prerendered shell
    const pathname = window.location.pathname;
    const next = pathname !== ROUTES.home ? `?next=${encodeURIComponent(pathname)}` : "";
    router.replace(`${ROUTES.login}${next}`);
  }, [status, router]);

  const ready = status === "authenticated";

  // The page always renders (so it stays in the prerendered shell and Next can validate instant
  // navigation); until the session is restored it is hidden behind the splash and made inert.
  return (
    <>
      <div className="contents" inert={!ready}>
        {children}
      </div>
      {!ready && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
          aria-busy="true"
          role="status"
        >
          <LogoMark className="size-20" />
        </div>
      )}
    </>
  );
}
