import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MdArrowBack } from 'react-icons/md';

import { useAuth } from '@/features/auth/useAuth';
import { useProfileForm, ProfileCard } from '@/features/profile';
import { HeaderSection } from '@/shared/components/HeaderSection';
import { cn } from '@/shared/utils';

import { MainLayout } from './MainLayout';

export function Profile() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const form = useProfileForm();

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
            <span>{t('profile.goHome', 'Go to home')}</span>
          </Link>
        }
        title={t('profile.title', 'Profile')}
        subtitle={t('profile.subtitle', 'Update your profile information and avatar.')}
      />

      <ProfileCard
        user={user}
        name={form.name}
        setName={form.setName}
        avatarPreviewUrl={form.avatarPreviewUrl}
        avatarFile={form.avatarFile}
        galleryInputRef={form.galleryInputRef}
        onSelectAvatar={form.handleSelectAvatar}
        hasChanges={form.hasChanges}
        isSaving={form.isSaving}
        onSave={() => void form.handleSave()}
      />
    </MainLayout>
  );
}
