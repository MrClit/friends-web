import { EventsList, EventFormModal } from '../features/events/components';
import { useEventsUIStore } from '../features/events';
import AppHeader from '../shared/components/AppHeader';
import FloatingActionButton from '../shared/components/FloatingActionButton';

export default function Home() {
  const { isModalOpen, openModal, closeModal } = useEventsUIStore();

  return (
    <div className="min-h-screen flex flex-col items-center bg-linear-to-b from-teal-50 to-teal-100 dark:from-teal-900 dark:to-teal-950 p-4">
      <AppHeader />
      <main className="w-full max-w-2xl">
        <EventsList />
      </main>
      <FloatingActionButton onClick={openModal} translationKey="home.newEvent" icon={'+'} />
      <EventFormModal open={isModalOpen} onClose={closeModal} />
    </div>
  );
}
