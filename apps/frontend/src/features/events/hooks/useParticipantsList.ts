import { useCallback, useState } from 'react';
import type { EventParticipant } from '../types';

interface UseParticipantsListParams {
  setParticipants: (newParticipants: EventParticipant[] | ((prev: EventParticipant[]) => EventParticipant[])) => void;
}

export function useParticipantsList({ setParticipants }: UseParticipantsListParams) {
  const [inputValue, setInputValue] = useState('');

  /**
   * Add a participant (from combobox selection or manual input)
   * Handles both existing users and new guests
   */
  const handleAddParticipant = useCallback(
    (participant: EventParticipant) => {
      setParticipants((p: EventParticipant[]) => [...p, participant]);
    },
    [setParticipants],
  );

  /**
   * Remove a participant by index
   * Cannot remove the first participant (organizer/POT)
   */
  const handleDeleteParticipant = useCallback(
    (idx: number) => {
      setParticipants((prev) => prev.filter((_, i) => i !== idx));
    },
    [setParticipants],
  );

  return {
    inputValue,
    setInputValue,
    handleAddParticipant,
    handleDeleteParticipant,
  };
}
