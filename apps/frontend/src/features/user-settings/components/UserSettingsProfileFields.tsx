import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { MdSave } from 'react-icons/md';

import { cn } from '@/shared/utils';
import { formatDateLong } from '@/shared/utils/format/formatDateLong';
import type { User } from '@/features/auth/types';

interface UserSettingsProfileFieldsProps {
  user: User;
  name: string;
  setName: (name: string) => void;
  hasChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
}

function formatProfileDate(value?: string): string {
  if (!value) {
    return '-';
  }
  return formatDateLong(value) || '-';
}

interface InfoFieldProps {
  label: string;
  value: string;
}

function InfoField({ label, value }: InfoFieldProps) {
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
}

export const UserSettingsProfileFields = memo(function UserSettingsProfileFields({
  user,
  name,
  setName,
  hasChanges,
  isSaving,
  onSave,
}: UserSettingsProfileFieldsProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        'space-y-6 rounded-xl border p-5 shadow-sm',
        'border-slate-200/80 bg-white/85',
        'dark:border-emerald-800/60 dark:bg-emerald-950/45',
        'sm:p-6',
      )}
    >
      <div className="space-y-2">
        <label
          htmlFor="settings-name"
          className="block text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-emerald-300/85"
        >
          {t('userSettings.fields.name', 'Name')}
        </label>
        <input
          id="settings-name"
          type="text"
          value={name}
          maxLength={255}
          onChange={(event) => setName(event.target.value)}
          className={cn(
            'w-full rounded-xl border px-4 py-3 text-base',
            'border-slate-300/90 bg-white/95 text-slate-900 placeholder:text-slate-400',
            'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2',
            'dark:border-emerald-700/70 dark:bg-emerald-950/70 dark:text-emerald-50',
            'dark:placeholder:text-emerald-300/40',
            'dark:focus:ring-offset-emerald-950',
          )}
        />
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <InfoField label={t('userSettings.fields.email', 'Email')} value={user.email} />
        <InfoField label={t('userSettings.fields.role', 'Role')} value={user.role.toUpperCase()} />
        <InfoField
          label={t('userSettings.fields.createdAt', 'Member since')}
          value={formatProfileDate(user.createdAt)}
        />
        <InfoField
          label={t('userSettings.fields.updatedAt', 'Last updated')}
          value={formatProfileDate(user.updatedAt)}
        />
      </dl>

      <div className="pt-1">
        <button
          type="button"
          onClick={onSave}
          disabled={!hasChanges || isSaving}
          className={cn(
            'inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3',
            'text-sm font-semibold text-white',
            'bg-teal-600 transition-colors hover:cursor-pointer hover:bg-emerald-700',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:cursor-not-allowed disabled:hover:bg-teal-600',
            'dark:focus-visible:ring-offset-emerald-950',
            'sm:w-auto',
          )}
        >
          <MdSave className="text-lg" aria-hidden />
          {isSaving ? t('userSettings.actions.saving', 'Saving...') : t('userSettings.actions.save', 'Save changes')}
        </button>
      </div>
    </div>
  );
});
