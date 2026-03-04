import { useTranslation } from 'react-i18next';

import { ADMIN_ROLE, USER_ROLE, type User } from '@/features/auth/types';

interface AdminUsersStatsProps {
  users: User[];
}

export function AdminUsersStats({ users }: AdminUsersStatsProps) {
  const { t } = useTranslation();

  const totalUsers = users.length;
  const adminUsers = users.filter((user) => user.role === ADMIN_ROLE).length;
  const regularUsers = users.filter((user) => user.role === USER_ROLE).length;

  return (
    <>
      <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50/70 p-2 dark:border-emerald-800/50 dark:bg-emerald-950/60 sm:hidden">
        <dl className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-700">
          <div className="px-2 text-center">
            <dt className="text-[10px] font-medium text-slate-600 dark:text-slate-300">
              {t('adminUsers.stats.totalShort', 'Total')}
            </dt>
            <dd className="mt-1 text-xl font-semibold leading-none text-slate-900 dark:text-slate-100">{totalUsers}</dd>
          </div>
          <div className="px-2 text-center">
            <dt className="text-[10px] font-medium text-purple-700 dark:text-purple-200">
              {t('adminUsers.stats.adminShort', 'Admin')}
            </dt>
            <dd className="mt-1 text-xl font-semibold leading-none text-purple-800 dark:text-purple-100">
              {adminUsers}
            </dd>
          </div>
          <div className="px-2 text-center">
            <dt className="text-[10px] font-medium text-blue-700 dark:text-blue-200">
              {t('adminUsers.stats.userShort', 'User')}
            </dt>
            <dd className="mt-1 text-xl font-semibold leading-none text-blue-800 dark:text-blue-100">{regularUsers}</dd>
          </div>
        </dl>
      </div>

      <div className="mb-4 hidden grid-cols-3 gap-2 sm:grid">
        <article className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3 dark:border-emerald-800/50 dark:bg-emerald-950/60">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-300">
            {t('adminUsers.stats.total', 'Total users')}
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{totalUsers}</p>
        </article>

        <article className="rounded-lg border border-purple-200 bg-purple-50/70 px-4 py-3 dark:border-emerald-800/50 dark:bg-emerald-950/60">
          <p className="text-xs font-medium uppercase tracking-wide text-purple-700 dark:text-purple-200">
            {t('adminUsers.stats.admin', 'Admins')}
          </p>
          <p className="mt-1 text-2xl font-semibold text-purple-800 dark:text-purple-100">{adminUsers}</p>
        </article>

        <article className="rounded-lg border border-blue-200 bg-blue-50/70 px-4 py-3 dark:border-emerald-800/50 dark:bg-emerald-950/60">
          <p className="text-xs font-medium uppercase tracking-wide text-blue-700 dark:text-blue-200">
            {t('adminUsers.stats.user', 'Users')}
          </p>
          <p className="mt-1 text-2xl font-semibold text-blue-800 dark:text-blue-100">{regularUsers}</p>
        </article>
      </div>
    </>
  );
}
