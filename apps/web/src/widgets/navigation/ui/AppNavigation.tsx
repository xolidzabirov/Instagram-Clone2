"use client";

import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { PathnameContext } from "../model/useNavigation";
import { BottomNav, MobileHeader } from "./MobileNavigation";
import { NotificationsPanel } from "./NotificationsPanel";
import { SearchPanel } from "./SearchPanel";
import { Sidebar } from "./Sidebar";

function WithPathname({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  return <PathnameContext value={pathname}>{children}</PathnameContext>;
}

/**
 * The app's navigation for every screen size:
 * sidebar from 768px (with labels from 1280px), top and bottom bars on phones.
 * On dynamic routes the URL is known only at request time, so the prerendered shell shows the
 * same navigation without an active item until it is.
 */
export function AppNavigation() {
  const navigation = (
    <>
      <Sidebar />
      <MobileHeader />
      <BottomNav />
      <SearchPanel />
      <NotificationsPanel />
    </>
  );

  return (
    <Suspense fallback={navigation}>
      <WithPathname>{navigation}</WithPathname>
    </Suspense>
  );
}
