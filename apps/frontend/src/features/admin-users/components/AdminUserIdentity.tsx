import type { User } from '@/features/auth/types';
import { Avatar } from '@/shared/components/Avatar';

interface AdminUserIdentityProps {
  user: User;
  showEmail?: boolean;
}

export function AdminUserIdentity({ user, showEmail = false }: AdminUserIdentityProps) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Avatar
        avatar={user.avatar}
        name={user.name}
        email={user.email}
        className="h-8 w-8 shrink-0 rounded-full object-cover"
        fallbackClassName="h-8 w-8 shrink-0 rounded-full bg-gray-200 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-100 flex items-center justify-center"
      />

      {showEmail ? (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{user.name || '—'}</p>
          <p className="truncate text-xs text-gray-600 dark:text-gray-300">{user.email}</p>
        </div>
      ) : (
        <span className="truncate text-sm text-gray-900 dark:text-gray-100">{user.name || '—'}</span>
      )}
    </div>
  );
}
