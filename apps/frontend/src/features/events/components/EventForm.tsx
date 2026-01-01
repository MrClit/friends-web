import type { EventParticipant } from '../types';
import ParticipantsInput from "./ParticipantsInput";
import { useTranslation } from "react-i18next";

interface EventFormProps {
  title: string;
  setTitle: (title: string) => void;
  participants: EventParticipant[];
  setParticipants: (newParticipants: EventParticipant[] | ((prev: EventParticipant[]) => EventParticipant[])) => void;
  onSubmit: (e: React.FormEvent) => void;
  canSubmit: boolean;
  mode?: 'edit' | 'create';
}

export default function EventForm({
  title,
  setTitle,
  participants,
  setParticipants,
  onSubmit,
  canSubmit,
  mode,
}: EventFormProps) {
  const { t } = useTranslation();
  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <div>
        <label htmlFor="event-title" className="block text-teal-700 dark:text-teal-100 font-medium mb-1">{t('eventForm.titleLabel')}</label>
        <input
          id="event-title"
          type="text"
          className="w-full px-4 py-2 rounded-lg border border-teal-200 dark:border-teal-700 bg-teal-50 dark:bg-teal-800 text-teal-900 dark:text-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
          placeholder={t('eventForm.titlePlaceholder')}
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
      </div>
      <ParticipantsInput participants={participants} setParticipants={setParticipants} />
      <button
        type="submit"
        className="w-full py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-white font-bold text-lg transition"
        disabled={!canSubmit}
      >
        {mode === 'edit' ? t('eventForm.update') : t('eventForm.create')}
      </button>
    </form>
  );
}