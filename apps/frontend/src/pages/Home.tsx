import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EventsList, EventFormModal } from '../features/events/components';
import { Logo } from '../shared/components';
import FloatingActionButton from '../shared/components/FloatingActionButton';
import LanguageMenu from '../shared/components/LanguageMenu';
import DarkModeToggle from '../shared/components/DarkModeToggle';

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-teal-50 to-teal-100 dark:from-teal-900 dark:to-teal-950 p-4 relative">
      {/* Header con dark mode, logo y selector de idioma */}
      <div className="w-full max-w-2xl flex flex-row justify-between items-start mb-8 gap-2">
        <DarkModeToggle />
        <Logo />
        <LanguageMenu />
      </div>
      <EventsList />
      <FloatingActionButton onClick={() => setModalOpen(true)} label={t('home.newEvent')} icon={'+'} />
      <EventFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
