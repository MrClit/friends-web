import { useState } from "react";
import { useTranslation } from "react-i18next";
import { EventsList, EventFormModal } from '../features/events/components';
import { Logo } from '../shared/components';
import FloatingActionButton from '../shared/components/FloatingActionButton';

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);
  const { i18n, t } = useTranslation();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-teal-50 to-teal-100 dark:from-teal-900 dark:to-teal-950 p-4 relative">
      {/* Selector de idioma */}
      <select
        className="absolute top-4 right-4 bg-white dark:bg-teal-950 border border-teal-300 dark:border-teal-800 rounded px-2 py-1 text-sm shadow focus:outline-none focus:ring-2 focus:ring-teal-400"
        value={i18n.language}
        onChange={handleChange}
        aria-label="Seleccionar idioma"
      >
        <option value="es">ES</option>
        <option value="en">EN</option>
        <option value="ca">CA</option>
      </select>
      <Logo />
      <EventsList />
      <FloatingActionButton onClick={() => setModalOpen(true)} label={t('home.newEvent')} icon={"+"} />
      <EventFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
