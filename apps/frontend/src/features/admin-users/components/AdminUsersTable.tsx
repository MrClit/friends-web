import { useTranslation } from 'react-i18next';

import type { User } from '@/features/auth/types';

import { AdminUserDesktopRow } from './AdminUserDesktopRow';
import { AdminUserMobileCard } from './AdminUserMobileCard';

interface AdminUsersTableProps {
  users: User[];
  disabled?: boolean;
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
}

export function AdminUsersTable({ users, disabled = false, onEdit, onDelete }: AdminUsersTableProps) {
  const { t } = useTranslation();
  const editLabel = t('common.edit', 'Edit');
  const deleteLabel = t('common.delete', 'Delete');

  return (
    <div className="md:rounded-lg md:border md:border-gray-200 md:bg-white md:shadow-sm md:dark:border-gray-800 md:dark:bg-gray-900">
      <div className="space-y-3 py-3 px-0 md:hidden">
        {users.map((user) => (
          <AdminUserMobileCard
            key={user.id}
            user={user}
            disabled={disabled}
            editLabel={editLabel}
            deleteLabel={deleteLabel}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-950">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t('adminUsers.fields.name', 'Name')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t('adminUsers.fields.email', 'Email')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t('adminUsers.fields.role', 'Role')}
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t('common.actions', 'Actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {users.map((user) => (
              <AdminUserDesktopRow
                key={user.id}
                user={user}
                disabled={disabled}
                editLabel={editLabel}
                deleteLabel={deleteLabel}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
