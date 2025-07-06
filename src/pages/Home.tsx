import { useState } from "react";
import Logo from "../components/Logo";
import EventsList from "../components/EventsList";
import AddNewEvent from "../components/AddNewEvent";
import NewEventModal from "../components/NewEventModal";

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-teal-50 to-teal-100 dark:from-teal-900 dark:to-teal-950 p-4 relative">
      <Logo />
      <EventsList />
      <AddNewEvent onClick={() => setModalOpen(true)} />
      <NewEventModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
