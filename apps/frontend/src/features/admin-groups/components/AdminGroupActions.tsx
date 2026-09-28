import { useTranslation } from 'react-i18next';

import type { AdminGroup } from '@/api/admin-groups.api';
import { cn } from '@/shared/utils';

interface AdminGroupActionsProps {
  group: AdminGroup;
  disabled: boolean;
  mobile?: boolean;
  onRename: (group: AdminGroup) => void;
  onDelete: (group: AdminGroup) => void;
}

export function AdminGroupActions({ group, disabled, mobile = false, onRename, onDelete }: AdminGroupActionsProps) {
  const { t } = useTranslation(['adminGroups', 'common']);
  const padding = mobile ? 'py-2' : 'py-1.5';

  return (
    <div className={mobile ? 'grid grid-cols-2 gap-2' : 'inline-flex gap-2'}>
      <button
        type="button"
        className={cn(
          'rounded-md border border-gray-300 px-3 text-xs font-medium text-gray-700',
          'hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50',
          'dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800',
          padding,
        )}
        onClick={() => onRename(group)}
        disabled={disabled}
      >
        {t('rename', { ns: 'adminGroups' })}
      </button>
      <button
        type="button"
        className={cn(
          'rounded-md border border-red-300 px-3 text-xs font-medium text-red-700',
          'hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50',
          'dark:border-red-700 dark:text-red-200 dark:hover:bg-red-900/20',
          padding,
        )}
        onClick={() => onDelete(group)}
        disabled={disabled}
      >
        {t('delete', { ns: 'common' })}
      </button>
    </div>
  );
}
