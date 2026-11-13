import { BottomNav, MobileHeader } from "./MobileNavigation";
import { NotificationsPanel } from "./NotificationsPanel";
import { SearchPanel } from "./SearchPanel";
import { Sidebar } from "./Sidebar";

/**
 * The app's navigation for every screen size:
 * sidebar from 768px (with labels from 1280px), top and bottom bars on phones.
 */
export function AppNavigation() {
  return (
    <>
      <Sidebar />
      <MobileHeader />
      <BottomNav />
      <SearchPanel />
      <NotificationsPanel />
    </>
  );
}
