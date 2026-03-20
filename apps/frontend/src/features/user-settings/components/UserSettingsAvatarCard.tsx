import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { MdPhotoCamera, MdPhotoLibrary } from 'react-icons/md';

import { Avatar } from '@/shared/components/Avatar';
import { cn } from '@/shared/utils';
import type { User } from '@/features/auth/types';

interface UserSettingsAvatarCardProps {
  user: User;
  name: string;
  avatarPreviewUrl: string | null;
  avatarFile: File | null;
  galleryInputRef: React.RefObject<HTMLInputElement | null>;
  cameraInputRef: React.RefObject<HTMLInputElement | null>;
  onSelectAvatar: (file: File | null) => void;
}

export const UserSettingsAvatarCard = memo(function UserSettingsAvatarCard({
  user,
  name,
  avatarPreviewUrl,
  avatarFile,
  galleryInputRef,
  cameraInputRef,
  onSelectAvatar,
}: UserSettingsAvatarCardProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        'rounded-xl border p-5 shadow-sm',
        'border-slate-200/80 bg-white/85',
        'dark:border-emerald-800/60 dark:bg-emerald-950/45',
        'sm:p-6',
      )}
    >
      <h3 className="text-lg font-bold text-slate-900 dark:text-emerald-50">
        {t('userSettings.avatar.title', 'Profile photo')}
      </h3>
      <p className="mt-1 text-sm text-slate-600 dark:text-emerald-200/75">
        {t('userSettings.avatar.subtitle', 'Choose an existing image or take a new photo from your device camera.')}
      </p>

      <div className="mt-5 flex items-center gap-4">
        <Avatar
          avatar={avatarPreviewUrl ?? user.avatar}
          name={name || user.name}
          email={user.email}
          alt={name || user.name || user.email}
          className="h-20 w-20 rounded-full"
          imageClassName={cn('h-20 w-20 object-cover', 'ring-2 ring-teal-300/80 shadow-sm', 'dark:ring-teal-700/70')}
          fallbackClassName={cn(
            'flex h-20 w-20 items-center justify-center rounded-full',
            'text-xl font-bold text-white',
            'bg-gradient-to-br from-teal-500 to-emerald-600',
            'ring-2 ring-teal-300/80 shadow-sm dark:ring-teal-700/70',
          )}
        />

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className={cn(
              'inline-flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2',
              'text-sm font-semibold text-slate-700',
              'border-slate-300/80 bg-white/95',
              'transition-colors hover:cursor-pointer hover:border-slate-400/80 hover:bg-slate-50',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2',
              'dark:border-emerald-700/70 dark:bg-emerald-950/70 dark:text-emerald-100',
              'dark:hover:border-emerald-600/70 dark:hover:bg-emerald-900/45',
              'dark:focus-visible:ring-offset-emerald-950',
            )}
          >
            <MdPhotoLibrary className="text-lg" aria-hidden />
            {t('userSettings.avatar.choose', 'Choose photo')}
          </button>

          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className={cn(
              'inline-flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2',
              'text-sm font-semibold text-slate-700',
              'border-slate-300/80 bg-white/95',
              'transition-colors hover:cursor-pointer hover:border-slate-400/80 hover:bg-slate-50',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2',
              'dark:border-emerald-700/70 dark:bg-emerald-950/70 dark:text-emerald-100',
              'dark:hover:border-emerald-600/70 dark:hover:bg-emerald-900/45',
              'dark:focus-visible:ring-offset-emerald-950',
            )}
          >
            <MdPhotoCamera className="text-lg" aria-hidden />
            {t('userSettings.avatar.camera', 'Take photo')}
          </button>
        </div>

        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => onSelectAvatar(event.target.files?.[0] ?? null)}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(event) => onSelectAvatar(event.target.files?.[0] ?? null)}
        />
      </div>

      {avatarFile && <p className="mt-3 text-xs text-slate-600 dark:text-emerald-200/80">{avatarFile.name}</p>}
    </div>
  );
});
