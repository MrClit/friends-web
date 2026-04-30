import { useCallback, useState } from 'react';
import type { EventParticipant, ParticipantReplacement } from '../types';
import { calculateSuggestedTargets } from '../utils/calculateSuggestedTargets';

type InlineEditionState =
  | { mode: 'idle' }
  | { mode: 'replacing'; guestId: string; inputValue: string }
  | { mode: 'renaming'; guestId: string; name: string };

const IDLE: InlineEditionState = { mode: 'idle' };

interface UseParticipantsListParams {
  participants: EventParticipant[];
  setParticipants: (newParticipants: EventParticipant[] | ((prev: EventParticipant[]) => EventParticipant[])) => void;
  setParticipantReplacements: (
    replacements: ParticipantReplacement[] | ((prev: ParticipantReplacement[]) => ParticipantReplacement[]),
  ) => void;
}

export function useParticipantsList({
  participants,
  setParticipants,
  setParticipantReplacements,
}: UseParticipantsListParams) {
  const [inputValue, setInputValue] = useState('');
  const [inlineEdition, setInlineEdition] = useState<InlineEditionState>(IDLE);

  const replacingGuestId = inlineEdition.mode === 'replacing' ? inlineEdition.guestId : null;
  const renamingGuestId = inlineEdition.mode === 'renaming' ? inlineEdition.guestId : null;

  const handleAddParticipant = useCallback(
    (participant: EventParticipant) => {
      setParticipants((p: EventParticipant[]) => [...p, participant]);
    },
    [setParticipants],
  );

  const handleDeleteParticipant = useCallback(
    (idx: number) => {
      const removedParticipant = participants[idx];

      setParticipants((prev) => prev.filter((_, i) => i !== idx));

      if (!removedParticipant) return;

      setParticipantReplacements((prev) =>
        prev.filter((r) => r.fromGuestId !== removedParticipant.id && r.toUserId !== removedParticipant.id),
      );

      if (inlineEdition.mode !== 'idle' && inlineEdition.guestId === removedParticipant.id) {
        setInlineEdition(IDLE);
      }
    },
    [participants, setParticipants, setParticipantReplacements, inlineEdition],
  );

  const handleStartReplaceGuest = useCallback((guestId: string) => {
    setInlineEdition({ mode: 'replacing', guestId, inputValue: '' });
  }, []);

  const handleCancelReplaceGuest = useCallback(() => {
    setInlineEdition(IDLE);
  }, []);

  const handleReplaceInputChange = useCallback((value: string) => {
    setInlineEdition((prev) => (prev.mode === 'replacing' ? { ...prev, inputValue: value } : prev));
  }, []);

  const handleReplaceGuestWithUser = useCallback(
    (participant: EventParticipant) => {
      if (inlineEdition.mode !== 'replacing' || participant.type !== 'user') return;

      const fromGuestId = inlineEdition.guestId;

      setParticipants((prev) =>
        prev.map((current) => {
          if (current.type === 'guest' && current.id === fromGuestId) {
            return {
              type: 'user',
              id: participant.id,
              name: participant.name,
              email: participant.email,
              avatar: participant.avatar,
              // Preserve contribution target from the guest
              ...(current.contributionTarget !== undefined && { contributionTarget: current.contributionTarget }),
            };
          }
          return current;
        }),
      );

      setParticipantReplacements((prev) => {
        const filtered = prev.filter((r) => r.fromGuestId !== fromGuestId && r.toUserId !== participant.id);
        return [...filtered, { fromGuestId, toUserId: participant.id }];
      });

      setInlineEdition(IDLE);
    },
    [inlineEdition, setParticipants, setParticipantReplacements],
  );

  const handleStartRenameGuest = useCallback((guestId: string, currentName: string) => {
    setInlineEdition({ mode: 'renaming', guestId, name: currentName });
  }, []);

  const handleCancelRenameGuest = useCallback(() => {
    setInlineEdition(IDLE);
  }, []);

  const handleRenameGuestNameChange = useCallback((name: string) => {
    setInlineEdition((prev) => (prev.mode === 'renaming' ? { ...prev, name } : prev));
  }, []);

  const handleCommitRenameGuest = useCallback(() => {
    if (inlineEdition.mode !== 'renaming') return;

    const trimmedName = inlineEdition.name.trim();
    if (!trimmedName) return;

    setParticipants((prev) =>
      prev.map((p) => (p.type === 'guest' && p.id === inlineEdition.guestId ? { ...p, name: trimmedName } : p)),
    );

    setInlineEdition(IDLE);
  }, [inlineEdition, setParticipants]);

  const handleCalculateTargets = useCallback(
    (totalExpenses: number) => {
      setParticipants((prev) => calculateSuggestedTargets(prev, totalExpenses));
    },
    [setParticipants],
  );

  const handleUpdateParticipantTarget = useCallback(
    (idx: number, target: number | undefined) => {
      setParticipants((prev) => [
        ...prev.slice(0, idx),
        prev[idx]
          ? target === 0 || target === undefined
            ? // Remove target if 0 or undefined (default)
              (Object.fromEntries(
                Object.entries(prev[idx]).filter(([key]) => key !== 'contributionTarget'),
              ) as EventParticipant)
            : // Set target for non-zero values
              { ...prev[idx], contributionTarget: target }
          : prev[idx],
        ...prev.slice(idx + 1),
      ]);
    },
    [setParticipants],
  );

  return {
    inputValue,
    setInputValue,
    replaceInputValue: inlineEdition.mode === 'replacing' ? inlineEdition.inputValue : '',
    replacingGuestId,
    renamingGuestId,
    renamingGuestName: inlineEdition.mode === 'renaming' ? inlineEdition.name : '',
    handleAddParticipant,
    handleDeleteParticipant,
    handleStartReplaceGuest,
    handleCancelReplaceGuest,
    handleReplaceInputChange,
    handleReplaceGuestWithUser,
    handleStartRenameGuest,
    handleCancelRenameGuest,
    handleRenameGuestNameChange,
    handleCommitRenameGuest,
    handleUpdateParticipantTarget,
    handleCalculateTargets,
  };
}
