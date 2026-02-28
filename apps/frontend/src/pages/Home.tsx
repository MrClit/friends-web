import { EventsList, EventFormModal } from '../features/events/components';
import { useEventFormModalStore } from '@/shared/store/useEventFormModalStore';
import { MainLayout } from './MainLayout';
// import FloatingActionButton from '../shared/components/FloatingActionButton';
import { HeaderSection } from '@/shared/components/HeaderSection';
import { useTranslation } from 'react-i18next';
import { MdAdd } from 'react-icons/md';

export function Home() {
  const { openModal } = useEventFormModalStore();
  const { t } = useTranslation();

  return (
    <MainLayout>
      <HeaderSection
        title={t('home.title')}
        subtitle={t('home.subtitle')}
        actionLabel={t('home.newEvent')}
        onNewEvent={openModal}
        actionIcon={<MdAdd size={22} />}
      />
      <EventsList />
      <EventFormModal />
    </MainLayout>
  );
}
