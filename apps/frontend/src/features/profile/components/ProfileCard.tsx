import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { MdSave } from 'react-icons/md';

import { cn } from '@/shared/utils';
import { formatDateLong } from '@/shared/utils/format/formatDateLong';
import type { User } from '@/features/auth/types';

import { ProfileAvatarPicker } from './ProfileAvatarPicker';
import { ProfileInfoField } from './ProfileInfoField';

function formatProfileDate(value?: string): string {
  if (!value) return '-';
  return formatDateLong(value) || '-';
}

interface ProfileCardProps {
  user: User;
  name: string;
  setName: (name: string) => void;
  avatarPreviewUrl: string | null;
  avatarFile: File | null;
  galleryInputRef: React.RefObject<HTMLInputElement | null>;
  onSelectAvatar: (file: File | null) => void;
  hasChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
}

export const ProfileCard = memo(function ProfileCard({
  user,
  name,
  setName,
  avatarPreviewUrl,
  avatarFile,
  galleryInputRef,
  onSelectAvatar,
  hasChanges,
  isSaving,
  onSave,
}: ProfileCardProps) {
  const { t } = useTranslation('profile');
  const displayName = name.trim() || user.name;

  return (
    <div
      className={cn(
        'rounded-xl border p-5 shadow-sm',
        'border-slate-200/80 bg-white/85',
        'dark:border-emerald-800/60 dark:bg-emerald-950/45',
        'sm:p-6',
      )}
    >
      <div className={cn('flex flex-col items-center gap-6', 'sm:flex-row sm:items-start sm:gap-8')}>
        <ProfileAvatarPicker
          user={user}
          displayName={displayName}
          avatarPreviewUrl={avatarPreviewUrl}
          avatarFile={avatarFile}
          galleryInputRef={galleryInputRef}
          onSelectAvatar={onSelectAvatar}
        />

        <div className="w-full flex-1 space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="profile-name"
              className="block text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-emerald-300/85"
            >
              {t('fields.name', 'Name')}
            </label>
            <input
              id="profile-name"
              type="text"
              value={name}
              maxLength={255}
              onChange={(event) => setName(event.target.value)}
              className={cn(
                'w-full rounded-xl border px-4 py-3 text-base',
                'border-slate-300/90 bg-white/95 text-slate-900 placeholder:text-slate-400',
                'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2',
                'dark:border-emerald-700/70 dark:bg-emerald-950/70 dark:text-emerald-50',
                'dark:placeholder:text-emerald-300/40 dark:focus:ring-offset-emerald-950',
              )}
            />
          </div>

          <dl className="grid gap-3 sm:grid-cols-2">
            <ProfileInfoField label={t('fields.email', 'Email')} value={user.email} />
            <ProfileInfoField label={t('fields.role', 'Role')} value={user.role.toUpperCase()} />
            <ProfileInfoField label={t('fields.createdAt', 'Member since')} value={formatProfileDate(user.createdAt)} />
            <ProfileInfoField label={t('fields.updatedAt', 'Last updated')} value={formatProfileDate(user.updatedAt)} />
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
                'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-teal-600',
                'dark:focus-visible:ring-offset-emerald-950 sm:w-auto',
              )}
            >
              <MdSave className="text-lg" aria-hidden />
              {isSaving ? t('actions.saving', 'Saving...') : t('actions.save', 'Save changes')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
