import { useState } from "react";
import { EventsList, EventAddButton, EventFormModal } from '../features/events/components';
import { Logo } from '../shared/components';

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-teal-50 to-teal-100 dark:from-teal-900 dark:to-teal-950 p-4 relative">
      <Logo />
      <EventsList />
      <EventAddButton onClick={() => setModalOpen(true)} />
      <EventFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
