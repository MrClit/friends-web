import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MdArrowBack } from 'react-icons/md';

import { useAuth } from '@/features/auth/useAuth';
import { useUserSettingsForm, UserSettingsAvatarCard, UserSettingsProfileFields } from '@/features/user-settings';
import { HeaderSection } from '@/shared/components/HeaderSection';
import { cn } from '@/shared/utils';

import { MainLayout } from './MainLayout';

export function UserSettings() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const form = useUserSettingsForm();

  if (loading) {
    return (
      <MainLayout>
        <p className="text-slate-600 dark:text-emerald-200">{t('common.loading')}</p>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <p className="text-red-600 dark:text-red-300">{t('common.notFoundOrNoAccess')}</p>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <HeaderSection
        eyebrow={
          <Link
            to="/"
            className={cn(
              '-ml-1 inline-flex items-center gap-1.5 rounded-md px-1 py-0.5',
              'text-sm font-semibold text-emerald-700/90',
              'transition-colors hover:text-emerald-900',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
              'focus-visible:ring-offset-2 dark:text-emerald-300 dark:hover:text-emerald-100',
              'dark:focus-visible:ring-offset-emerald-950',
            )}
          >
            <MdArrowBack size={18} aria-hidden />
            <span>{t('userSettings.goHome', 'Go to home')}</span>
          </Link>
        }
        title={t('userSettings.title', 'User Settings')}
        subtitle={t('userSettings.subtitle', 'Update your profile information and avatar.')}
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <UserSettingsAvatarCard
          user={user}
          name={form.trimmedName}
          avatarPreviewUrl={form.avatarPreviewUrl}
          avatarFile={form.avatarFile}
          galleryInputRef={form.galleryInputRef}
          cameraInputRef={form.cameraInputRef}
          onSelectAvatar={form.handleSelectAvatar}
        />
        <UserSettingsProfileFields
          user={user}
          name={form.name}
          setName={form.setName}
          hasChanges={form.hasChanges}
          isSaving={form.isSaving}
          onSave={() => void form.handleSave()}
        />
      </div>
    </MainLayout>
  );
}
