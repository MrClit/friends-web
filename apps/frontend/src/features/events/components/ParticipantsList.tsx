import { MdDelete, MdPersonAdd } from 'react-icons/md';
import type { EventParticipant } from '../types';
import { useTranslation } from 'react-i18next';
import { useParticipantsList } from '../hooks/useParticipantsList';
import { stringAvatar } from '@/shared/utils/stringAvatar';
import { cn } from '@/shared/utils/cn';

interface ParticipantsListProps {
  participants: EventParticipant[];
  setParticipants: (newParticipants: EventParticipant[] | ((prev: EventParticipant[]) => EventParticipant[])) => void;
}

export default function ParticipantsList({ participants, setParticipants }: ParticipantsListProps) {
  const { t } = useTranslation();
  const {
    newParticipantName,
    setNewParticipantName,
    canAddParticipant,
    handleAddParticipant,
    handleNewParticipantKeyDown,
    handleDeleteParticipant,
  } = useParticipantsList({ setParticipants });

  return (
    <div>
      <div className="block text-slate-700 dark:text-emerald-100 font-medium mb-2">{t('participantsInput.label')}</div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MdPersonAdd className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
          <input
            type="text"
            className="w-full pl-11 pr-5 py-3.5 rounded-2xl border border-slate-200 dark:border-emerald-800 bg-slate-50 dark:bg-emerald-900/30 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white placeholder:text-slate-400 dark:placeholder:text-emerald-700 font-medium"
            placeholder={t('participantsInput.placeholder')}
            value={newParticipantName}
            onChange={(e) => setNewParticipantName(e.target.value)}
            onKeyDown={handleNewParticipantKeyDown}
          />
        </div>

        <button
          type="button"
          aria-label={t('participantsInput.addAria')}
          className="bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 px-5 rounded-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleAddParticipant}
          disabled={!canAddParticipant}
        >
          Añadir
        </button>
      </div>
      <div id="participants-group" className="space-y-3 pt-2">
        {participants.map((participant, idx) => (
          <div
            key={participant.id}
            className={cn(
              'flex items-center justify-between p-3 rounded-2xl ',
              idx === 0
                ? 'bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-100/50 dark:border-emerald-800/30'
                : 'hover:bg-slate-50 dark:hover:bg-emerald-900/10 transition-colors',
            )}
          >
            <div className="flex items-center gap-3">
              {/* TODO: Añadir Avatar cuando este disponible igual que se hace en el Header */}
              <span
                className={cn(
                  'w-10 h-10 rounded-full object-cover border-2 border-emerald-600/30 bg-emerald-600/10 font-bold',
                  'flex items-center justify-center',
                  'dark:bg-emerald-900/20 dark:border-emerald-800/30 dark:text-white',
                )}
              >
                {stringAvatar(participant.name)}
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{participant.name}</p>
            </div>

            {idx !== 0 && (
              <button
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                onClick={() => handleDeleteParticipant(idx)}
              >
                <MdDelete className="text-xl" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
