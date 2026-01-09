import { useRef, useEffect, useMemo, useCallback } from 'react';
import type { EventParticipant } from '../types';

interface UseParticipantsListParams {
  participants: EventParticipant[];
  setParticipants: (newParticipants: EventParticipant[] | ((prev: EventParticipant[]) => EventParticipant[])) => void;
}

export function useParticipantsList({ participants, setParticipants }: UseParticipantsListParams) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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
      setParticipants((prev) => prev.map((p, i) => (i === idx ? { ...p, name } : p)));
    },
    [setParticipants],
  );

  const handleDeleteParticipant = useCallback(
    (idx: number) => {
      setParticipants((prev) => prev.filter((_, i) => i !== idx));
    },
    [setParticipants],
  );

  return {
    inputRefs,
    canAddParticipant,
    handleAddParticipant,
    handleParticipantChange,
    handleDeleteParticipant,
  };
}
