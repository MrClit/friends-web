import { useTranslation } from 'react-i18next';

import { useAuth } from '@/features/auth/useAuth';
import { useProfileForm, ProfileCard } from '@/features/profile';
import { HeaderSection } from '@/shared/components/HeaderSection';

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
