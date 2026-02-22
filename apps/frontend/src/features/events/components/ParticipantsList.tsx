import { MdDelete } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { useParticipantsList } from '../hooks/useParticipantsList';
import { cn } from '@/shared/utils/cn';
import Avatar from '@/shared/components/Avatar';
import ParticipantsCombobox from './ParticipantsCombobox';
import type { EventParticipant } from '../types';
import { getParticipantAvatar, getParticipantName } from '../utils/participants';

interface ParticipantsListProps {
  participants: EventParticipant[];
  setParticipants: (newParticipants: EventParticipant[] | ((prev: EventParticipant[]) => EventParticipant[])) => void;
}

export default function ParticipantsList({ participants, setParticipants }: ParticipantsListProps) {
  const { t } = useTranslation();
  const { inputValue, setInputValue, handleAddParticipant, handleDeleteParticipant } = useParticipantsList({
    setParticipants,
  });

  return (
    <div>
      <div className="block text-slate-700 dark:text-emerald-100 font-medium mb-2">{t('participantsInput.label')}</div>
      <div className="flex gap-2">
        <ParticipantsCombobox
          onSelect={handleAddParticipant}
          existingParticipants={participants}
          inputValue={inputValue}
          onInputChange={setInputValue}
        />
      </div>
      <div id="participants-group" className="space-y-3 pt-2">
        {participants.map((participant, idx) => {
          const participantName = getParticipantName(participant, t);
          return (
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
                <Avatar
                  avatar={getParticipantAvatar(participant)}
                  name={participantName}
                  className={cn(
                    'w-10 h-10 rounded-full object-cover border-2 border-emerald-600/30 bg-emerald-600/10 font-bold',
                    'flex items-center justify-center',
                    'dark:bg-emerald-900/20 dark:border-emerald-800/30 dark:text-white',
                  )}
                  imageClassName="w-10 h-10"
                />
                <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{participantName}</p>
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
          );
        })}
      </div>
    </div>
  );
}
