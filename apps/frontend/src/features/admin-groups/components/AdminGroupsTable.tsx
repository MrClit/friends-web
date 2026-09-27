import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import type { AdminGroup } from '@/api/admin-groups.api';

import { AdminGroupActions } from './AdminGroupActions';

interface AdminGroupsTableProps {
  groups: AdminGroup[];
  disabled?: boolean;
  onRename: (group: AdminGroup) => void;
  onDelete: (group: AdminGroup) => void;
}

export function AdminGroupsTable({ groups, disabled = false, onRename, onDelete }: AdminGroupsTableProps) {
  const { t } = useTranslation(['adminGroups', 'common']);

  return (
    <div className="md:rounded-lg md:border md:border-gray-200 md:bg-white md:shadow-sm md:dark:border-gray-800 md:dark:bg-gray-900">
      <div className="space-y-3 py-3 px-0 md:hidden">
        {groups.map((group) => (
          <article
            key={group.id}
            className="rounded-md border border-slate-100 bg-white p-3 shadow-sm dark:border-emerald-800/50 dark:bg-emerald-950/60"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <Link
                to={`/admin/groups/${group.id}`}
                className="min-w-0 truncate text-sm font-semibold text-emerald-800 hover:underline dark:text-emerald-200"
              >
                {group.name}
              </Link>
              <span className="shrink-0 text-xs text-slate-600 dark:text-emerald-300/80">
                {t('memberCount', { ns: 'adminGroups', count: group.memberCount })}
              </span>
            </div>
            <AdminGroupActions group={group} disabled={disabled} mobile onRename={onRename} onDelete={onDelete} />
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-950">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t('fields.name', { ns: 'adminGroups' })}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t('fields.members', { ns: 'adminGroups' })}
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t('actions', { ns: 'common' })}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {groups.map((group) => (
              <tr key={group.id}>
                <td className="px-4 py-3 text-sm">
                  <Link
                    to={`/admin/groups/${group.id}`}
                    className="font-semibold text-emerald-800 hover:underline dark:text-emerald-200"
                  >
                    {group.name}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                  {group.memberCount}
                </td>
                <td className="px-4 py-3 text-right text-sm">
                  <AdminGroupActions group={group} disabled={disabled} onRename={onRename} onDelete={onDelete} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
