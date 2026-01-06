import { useRef, useEffect, useMemo, useCallback } from 'react';
import { MdDelete, MdPersonAdd } from 'react-icons/md';
import type { EventParticipant } from '../types';
import { useTranslation } from 'react-i18next';

interface ParticipantsListProps {
  participants: EventParticipant[];
  setParticipants: (newParticipants: EventParticipant[] | ((prev: EventParticipant[]) => EventParticipant[])) => void;
}

export default function ParticipantsList({ participants, setParticipants }: ParticipantsListProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { t } = useTranslation();

  // Memoize validation for add button
  const canAddParticipant = useMemo(
    () => participants.length > 0 && !!participants[participants.length - 1]?.name.trim(),
    [participants],
  );

  // Focus on last input when a new participant is added
  useEffect(() => {
    if (participants.length > 1) {
      const lastIndex = participants.length - 1;
      inputRefs.current[lastIndex]?.focus();
    }
  }, [participants.length]);

  // Cleanup refs array to match participants length
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, participants.length);
  }, [participants.length]);

  const handleAddParticipant = useCallback(() => {
    setParticipants((p: EventParticipant[]) => [...p, { id: crypto.randomUUID(), name: '' }]);
  }, [setParticipants]);

  const handleParticipantChange = useCallback(
    (idx: number, name: string) => {
      const newList = [...participants];
      newList[idx] = { ...participants[idx], name };
      setParticipants(newList);
    },
    [participants, setParticipants],
  );

  const handleDeleteParticipant = useCallback(
    (idx: number) => {
      const newList = participants.filter((_, i) => i !== idx);
      setParticipants(newList);
    },
    [participants, setParticipants],
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label htmlFor="participants-group" className="block text-teal-700 dark:text-teal-100 font-medium">
          {t('participantsInput.label')}
        </label>
        <button
          type="button"
          aria-label={t('participantsInput.addAria')}
          className="ml-2 p-1 rounded-full hover:bg-teal-200 dark:hover:bg-teal-700 text-teal-600 dark:text-teal-200 transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          onClick={handleAddParticipant}
          disabled={!canAddParticipant}
        >
          <MdPersonAdd className="text-2xl" />
        </button>
      </div>
      <div id="participants-group" className="space-y-4">
        {participants.map((participant, idx) => (
          <div key={participant.id} className="relative">
            <input
              id={participant.id}
              name={participant.id}
              ref={(el) => {
                inputRefs.current[idx] = el;
              }}
              type="text"
              className="block w-full px-4 py-2 rounded-lg border border-teal-200 dark:border-teal-700 bg-teal-50 dark:bg-teal-800 text-teal-900 dark:text-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-400 pr-10"
              placeholder={t('participantsInput.placeholder', { number: idx + 1 })}
              value={participant.name}
              onChange={(e) => handleParticipantChange(idx, e.target.value)}
            />
            {participants.length > 1 && (
              <div className="absolute right-2 top-1.5">
                <button
                  type="button"
                  aria-label={t('participantsInput.deleteAria')}
                  className="bg-white dark:bg-teal-900 shadow rounded p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors cursor-pointer"
                  onClick={() => handleDeleteParticipant(idx)}
                >
                  <MdDelete className="text-red-600 dark:text-red-400 text-lg" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
