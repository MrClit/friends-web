import { memo } from 'react';

import { cn } from '@/shared/utils';

export interface ProfileInfoFieldProps {
  label: string;
  value: string;
}

export const ProfileInfoField = memo(function ProfileInfoField({ label, value }: ProfileInfoFieldProps) {
  return (
    <div
      className={cn(
        'space-y-1 rounded-xl border px-4 py-3',
        'border-slate-200/90 bg-slate-50/75',
        'dark:border-emerald-800/60 dark:bg-emerald-900/20',
      )}
    >
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-emerald-300/80">{label}</dt>
      <dd className="text-sm font-semibold text-slate-900 dark:text-emerald-100">{value}</dd>
    </div>
  );
});
