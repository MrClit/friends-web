import { EventsList, EventFormModal } from '../features/events/components';
import { useModalState } from '@/hooks/common';
import AppHeader from '../shared/components/AppHeader';
import FloatingActionButton from '../shared/components/FloatingActionButton';

export default function Home() {
  const eventFormModal = useModalState();

  return (
    <div className="min-h-screen flex flex-col items-center bg-linear-to-b from-teal-50 to-teal-100 dark:from-teal-900 dark:to-teal-950 p-4">
      <AppHeader />
      <main className="w-full max-w-2xl">
        <EventsList />
      </main>
      <FloatingActionButton onClick={eventFormModal.open} translationKey="home.newEvent" icon={'+'} />
      <EventFormModal open={eventFormModal.isOpen} onClose={eventFormModal.close} />
    </div>
  );
}
