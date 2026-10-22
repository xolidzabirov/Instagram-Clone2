import type { UserPreview } from "@ig/shared";
import { UserAvatar } from "./UserAvatar";

interface UserListItemProps {
  user: UserPreview;
  action?: React.ReactNode;
  subtitle?: string;
  onClick?: () => void;
}

export function UserListItem({ user, action, subtitle, onClick }: UserListItemProps) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer"
      onClick={onClick}
      role={onClick ? "button" : undefined}
    >
      <UserAvatar src={user.avatar} alt={user.username} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
          {user.username}
          {user.isVerified && (
            <span className="ml-1 text-blue-500">✓</span>
          )}
        </p>
        <p className="text-sm text-zinc-500 truncate">
          {subtitle ?? user.fullName}
        </p>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
