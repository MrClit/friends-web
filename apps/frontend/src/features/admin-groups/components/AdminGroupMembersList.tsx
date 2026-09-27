import { useTranslation } from 'react-i18next';

import type { AdminGroupMember } from '@/api/admin-groups.api';
import { Avatar } from '@/shared/components/Avatar';

interface AdminGroupMembersListProps {
  members: AdminGroupMember[];
  disabled: boolean;
  onRemove: (member: AdminGroupMember) => void;
}

export function AdminGroupMembersList({ members, disabled, onRemove }: AdminGroupMembersListProps) {
  const { t } = useTranslation('adminGroups');

  return (
    <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white shadow-sm dark:divide-emerald-800/50 dark:border-emerald-800/50 dark:bg-emerald-950/60">
      {members.map((member) => {
        const displayName = member.name || member.email;
        return (
          <li key={member.id} className="flex items-center gap-3 px-3 py-3 md:px-4">
            <Avatar
              avatar={member.avatar}
              name={member.name ?? undefined}
              email={member.email}
              className="h-8 w-8 shrink-0 rounded-full object-cover"
              fallbackClassName="h-8 w-8 shrink-0 rounded-full bg-gray-200 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-100 flex items-center justify-center"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{member.name || '—'}</p>
              <p className="truncate text-xs text-gray-600 dark:text-gray-300">{member.email}</p>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-700 dark:text-red-200 dark:hover:bg-red-900/20"
              onClick={() => onRemove(member)}
              disabled={disabled}
              aria-label={t('detail.removeAria', { name: displayName })}
            >
              {t('detail.remove')}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
