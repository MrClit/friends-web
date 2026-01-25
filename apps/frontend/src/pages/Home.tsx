import { EventsList, EventFormModal } from '../features/events/components';
import { useModalState } from '@/hooks/common';
import MainLayout from './MainLayout';
// import FloatingActionButton from '../shared/components/FloatingActionButton';
import HeaderSection from '@/shared/components/HeaderSection';
import { useTranslation } from 'react-i18next';
import { MdAdd } from 'react-icons/md';

export default function Home() {
  const eventFormModal = useModalState();
  const { t } = useTranslation();

  return (
    <MainLayout>
      <HeaderSection
        title={t('home.title')}
        subtitle={t('home.subtitle')}
        actionLabel={t('home.newEvent')}
        onNewEvent={eventFormModal.open}
        actionIcon={<MdAdd size={22} />}
      />
      <EventsList />
      {/* <FloatingActionButton onClick={eventFormModal.open} translationKey="home.newEvent" icon={'+'} /> */}
      <EventFormModal open={eventFormModal.isOpen} onClose={eventFormModal.close} />
    </MainLayout>
  );
}
