import { useTranslation } from 'react-i18next';

import { ADMIN_ROLE, type User, type UserRole } from '@/features/auth/types';

interface AdminUsersTableProps {
  users: User[];
  disabled?: boolean;
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
}

function getRoleBadgeClass(role: UserRole): string {
  if (role === ADMIN_ROLE) {
    return 'border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-700 dark:bg-purple-900/30 dark:text-purple-200';
  }

  return 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-200';
}

export function AdminUsersTable({ users, disabled = false, onEdit, onDelete }: AdminUsersTableProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="space-y-3 p-3 md:hidden">
        {users.map((user) => (
          <article key={user.id} className="rounded-md border border-gray-200 p-3 dark:border-gray-800">
            <div className="mb-2 flex items-start justify-between gap-3">
              <p className="min-w-0 truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{user.email}</p>
              <span
                className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${getRoleBadgeClass(user.role)}`}
              >
                {user.role}
              </span>
            </div>

            <dl className="mb-3 space-y-1 text-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <dt className="font-medium">{t('adminUsers.fields.name', 'Name')}:</dt>
                <dd className="truncate text-gray-900 dark:text-gray-100">{user.name || '—'}</dd>
              </div>
            </dl>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="rounded-md border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                onClick={() => onEdit(user)}
                disabled={disabled}
              >
                {t('common.edit', 'Edit')}
              </button>
              <button
                type="button"
                className="rounded-md border border-red-300 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-700 dark:text-red-200 dark:hover:bg-red-900/20"
                onClick={() => onDelete(user.id)}
                disabled={disabled}
              >
                {t('common.delete', 'Delete')}
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-950">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t('adminUsers.fields.email', 'Email')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t('adminUsers.fields.name', 'Name')}
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
              <tr key={user.id}>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{user.email}</td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{user.name || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${getRoleBadgeClass(user.role)}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-sm">
                  <div className="inline-flex gap-2">
                    <button
                      type="button"
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                      onClick={() => onEdit(user)}
                      disabled={disabled}
                    >
                      {t('common.edit', 'Edit')}
                    </button>
                    <button
                      type="button"
                      className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-700 dark:text-red-200 dark:hover:bg-red-900/20"
                      onClick={() => onDelete(user.id)}
                      disabled={disabled}
                    >
                      {t('common.delete', 'Delete')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
