import type { User } from '@/features/auth/types';
import { formatDateShort } from '@/shared/utils/format/formatDateShort';

import { AdminUserActions } from './AdminUserActions';
import { AdminUserIdentity } from './AdminUserIdentity';
import { AdminUserRoleBadge } from './AdminUserRoleBadge';

interface AdminUserDesktopRowProps {
  user: User;
  disabled: boolean;
  editLabel: string;
  deleteLabel: string;
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
}

function formatAdminUserDate(value?: string): string {
  if (!value) return '-';
  return formatDateShort(value) || '-';
}

export function AdminUserDesktopRow({
  user,
  disabled,
  editLabel,
  deleteLabel,
  onEdit,
  onDelete,
}: AdminUserDesktopRowProps) {
  return (
    <tr>
      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
        <AdminUserIdentity user={user} />
      </td>
      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{user.email}</td>
      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
        <AdminUserRoleBadge role={user.role} />
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
        {formatAdminUserDate(user.createdAt)}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
        {formatAdminUserDate(user.updatedAt)}
      </td>
      <td className="px-4 py-3 text-right text-sm">
        <AdminUserActions
          user={user}
          disabled={disabled}
          editLabel={editLabel}
          deleteLabel={deleteLabel}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </td>
    </tr>
  );
}
