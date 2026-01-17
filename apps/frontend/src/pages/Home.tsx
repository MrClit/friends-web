import { EventsList, EventFormModal } from '../features/events/components';
import { useModalState } from '@/hooks/common';
import ProtectedLayout from './ProtectedLayout';
import FloatingActionButton from '../shared/components/FloatingActionButton';

export default function Home() {
  const eventFormModal = useModalState();

  return (
    <ProtectedLayout>
      <EventsList />
      <FloatingActionButton onClick={eventFormModal.open} translationKey="home.newEvent" icon={'+'} />
      <EventFormModal open={eventFormModal.isOpen} onClose={eventFormModal.close} />
    </ProtectedLayout>
  );
}
