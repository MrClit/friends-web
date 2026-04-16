import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { MdPhotoCamera } from 'react-icons/md';

import { Avatar } from '@/shared/components/Avatar';
import { cn } from '@/shared/utils';
import type { User } from '@/features/auth/types';

export interface ProfileAvatarPickerProps {
  user: User;
  displayName: string | undefined;
  avatarPreviewUrl: string | null;
  avatarFile: File | null;
  galleryInputRef: React.RefObject<HTMLInputElement | null>;
  onSelectAvatar: (file: File | null) => void;
}

export const ProfileAvatarPicker = memo(function ProfileAvatarPicker({
  user,
  displayName,
  avatarPreviewUrl,
  avatarFile,
  galleryInputRef,
  onSelectAvatar,
}: ProfileAvatarPickerProps) {
  const { t } = useTranslation('profile');

  return (
    <div className="flex flex-col items-center gap-2 sm:w-28 sm:shrink-0">
      <button
        type="button"
        onClick={() => galleryInputRef.current?.click()}
        aria-label={t('avatar.change', 'Change photo')}
        className={cn(
          'group relative h-24 w-24 cursor-pointer rounded-full',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
          'dark:focus-visible:ring-offset-emerald-950',
        )}
      >
        <Avatar
          avatar={avatarPreviewUrl ?? user.avatar}
          name={displayName}
          email={user.email}
          alt={displayName || user.email}
          className="h-24 w-24 rounded-full"
          imageClassName={cn('h-24 w-24 object-cover', 'ring-2 ring-emerald-300/80 shadow-sm', 'dark:ring-emerald-700/70')}
          fallbackClassName={cn(
            'flex h-24 w-24 items-center justify-center rounded-full',
            'text-2xl font-bold text-white',
            'bg-gradient-to-br from-emerald-500 to-emerald-600',
            'ring-2 ring-emerald-300/80 shadow-sm dark:ring-emerald-700/70',
          )}
        />

        <div
          aria-hidden
          className={cn(
            'absolute inset-0 flex items-center justify-center rounded-full',
            'bg-black/45 opacity-0 transition-opacity',
            'group-hover:opacity-100 group-focus-visible:opacity-100',
          )}
        >
          <MdPhotoCamera className="text-3xl text-white drop-shadow" />
        </div>

        <div
          aria-hidden
          className={cn(
            'absolute bottom-0.5 right-0.5',
            'flex h-7 w-7 items-center justify-center rounded-full',
            'bg-emerald-500 shadow-sm ring-2 ring-white dark:ring-emerald-950',
            'transition-opacity group-hover:opacity-0 group-focus-visible:opacity-0',
          )}
        >
          <MdPhotoCamera className="text-sm text-white" />
        </div>
      </button>

      <p className="text-center text-xs text-slate-500 dark:text-emerald-300/60">
        {t('avatar.subtitle', 'Tap to update')}
      </p>

      {avatarFile && (
        <p className="max-w-28 truncate text-center text-xs text-emerald-600 dark:text-emerald-400">{avatarFile.name}</p>
      )}

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => onSelectAvatar(event.target.files?.[0] ?? null)}
      />
    </div>
  );
});
