import { EventsList, EventFormModal } from '../features/events/components';
import { useEventFormModalStore } from '@/shared/store/useEventFormModalStore';
import { MainLayout } from './MainLayout';
// import FloatingActionButton from '../shared/components/FloatingActionButton';
import { HeaderSection } from '@/shared/components/HeaderSection';
import { useTranslation } from 'react-i18next';
import { useI18nNamespacesReady } from '@/shared/hooks/useI18nNamespacesReady';
import { MdAdd } from 'react-icons/md';

const HOME_NAMESPACES = ['home', 'events', 'common'] as const;

export function Home() {
  const { openModal } = useEventFormModalStore();
  const { t } = useTranslation(HOME_NAMESPACES);
  const isI18nReady = useI18nNamespacesReady(HOME_NAMESPACES);
  if (!isI18nReady) {
    return (
      <MainLayout>
        <p className="text-slate-600 dark:text-emerald-200">{t('loading', { ns: 'common' })}</p>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <HeaderSection
        title={t('title', { ns: 'home' })}
        subtitle={t('subtitle', { ns: 'home' })}
        actionLabel={t('newEvent', { ns: 'home' })}
        onNewEvent={openModal}
        actionIcon={<MdAdd size={22} />}
      />
      <EventsList />
      <EventFormModal />
    </MainLayout>
  );
}
