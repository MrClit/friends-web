import { useMemo, useCallback, useState } from 'react';
import type { EventParticipant } from '../types';

interface UseParticipantsListParams {
  setParticipants: (newParticipants: EventParticipant[] | ((prev: EventParticipant[]) => EventParticipant[])) => void;
}

export function useParticipantsList({ setParticipants }: UseParticipantsListParams) {
  const [newParticipantName, setNewParticipantName] = useState('');

  // Memoize validation for add button
  const canAddParticipant = useMemo(() => {
    return newParticipantName.trim().length > 0;
  }, [newParticipantName]);

  const handleAddParticipant = useCallback(() => {
    const trimmedName = newParticipantName.trim();
    if (!trimmedName) return;

    setParticipants((p: EventParticipant[]) => [...p, { id: crypto.randomUUID(), name: trimmedName }]);
    setNewParticipantName('');
  }, [newParticipantName, setParticipants]);

  const handleDeleteParticipant = useCallback(
    (idx: number) => {
      setParticipants((prev) => prev.filter((_, i) => i !== idx));
    },
    [setParticipants],
  );

  const handleNewParticipantKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && canAddParticipant) {
        e.preventDefault();
        handleAddParticipant();
      }
    },
    [canAddParticipant, handleAddParticipant],
  );

  return {
    newParticipantName,
    setNewParticipantName,
    canAddParticipant,
    handleAddParticipant,
    handleNewParticipantKeyDown,
    handleDeleteParticipant,
  };
}
