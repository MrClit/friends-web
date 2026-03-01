import { ADMIN_ROLE, type UserRole } from '@/features/auth/types';

interface AdminUserRoleBadgeProps {
  role: UserRole;
}

function getRoleBadgeClass(role: UserRole): string {
  if (role === ADMIN_ROLE) {
    return 'border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-700 dark:bg-purple-900/30 dark:text-purple-200';
  }

  return 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-200';
}

export function AdminUserRoleBadge({ role }: AdminUserRoleBadgeProps) {
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${getRoleBadgeClass(role)}`}>
      {role}
    </span>
  );
}
