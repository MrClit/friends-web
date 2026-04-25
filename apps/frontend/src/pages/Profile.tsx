import { useTranslation } from 'react-i18next';

import { useAuth } from '@/features/auth/useAuth';
import { useProfileForm, ProfileCard } from '@/features/profile';
import { HeaderSection } from '@/shared/components/HeaderSection';
import { useI18nNamespacesReady } from '@/shared/hooks/useI18nNamespacesReady';

import { MainLayout } from './MainLayout';

const PROFILE_NAMESPACES = ['profile', 'common'] as const;

export function Profile() {
  const { t } = useTranslation(PROFILE_NAMESPACES);
  const { user, loading } = useAuth();
  const form = useProfileForm();
  const isI18nReady = useI18nNamespacesReady(PROFILE_NAMESPACES);

  if (loading || !isI18nReady) {
    return (
      <MainLayout>
        <p className="text-slate-600 dark:text-emerald-200">{t('loading', { ns: 'common' })}</p>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <p className="text-red-600 dark:text-red-300">{t('notFoundOrNoAccess', { ns: 'common' })}</p>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <HeaderSection
        title={t('title', { ns: 'profile' })}
        subtitle={t('subtitle', { ns: 'profile' })}
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
