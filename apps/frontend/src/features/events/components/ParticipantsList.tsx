import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAutoGraph } from 'react-icons/md';
import { useParticipantsList } from '../hooks/useParticipantsList';
import { ParticipantsCombobox } from './ParticipantsCombobox';
import { ParticipantRow } from './ParticipantRow';
import type { EventParticipant, ParticipantReplacement } from '../types';

interface ParticipantsListProps {
  participants: EventParticipant[];
  setParticipants: (newParticipants: EventParticipant[] | ((prev: EventParticipant[]) => EventParticipant[])) => void;
  setParticipantReplacements: (
    replacements: ParticipantReplacement[] | ((prev: ParticipantReplacement[]) => ParticipantReplacement[]),
  ) => void;
  totalExpenses?: number;
}

export function ParticipantsList({
  participants,
  setParticipants,
  setParticipantReplacements,
  totalExpenses,
}: ParticipantsListProps) {
  const { t } = useTranslation('events');
  const listRef = useRef<HTMLDivElement | null>(null);
  const previousParticipantsCountRef = useRef(participants.length);

  const {
    inputValue,
    setInputValue,
    replaceInputValue,
    replacingGuestId,
    renamingGuestId,
    renamingGuestName,
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
  } = useParticipantsList({
    participants,
    setParticipants,
    setParticipantReplacements,
  });

  useEffect(() => {
    if (participants.length > previousParticipantsCountRef.current) {
      listRef.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    previousParticipantsCountRef.current = participants.length;
  }, [participants.length]);

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
      <div ref={listRef} id="participants-group" className="space-y-3 pt-2">
        {participants.map((participant, idx) => (
          <ParticipantRow
            key={participant.id}
            participant={participant}
            participantIndex={idx}
            isFirst={idx === 0}
            existingParticipants={participants}
            isRenamingGuest={renamingGuestId === participant.id}
            isReplacingGuest={replacingGuestId === participant.id}
            renamingGuestName={renamingGuestName}
            replaceInputValue={replaceInputValue}
            onDelete={() => handleDeleteParticipant(idx)}
            onStartReplace={() => handleStartReplaceGuest(participant.id)}
            onCancelReplace={handleCancelReplaceGuest}
            onReplaceWithUser={handleReplaceGuestWithUser}
            onReplaceInputChange={handleReplaceInputChange}
            onStartRename={() =>
              handleStartRenameGuest(participant.id, participant.type === 'guest' ? participant.name : '')
            }
            onCancelRename={handleCancelRenameGuest}
            onRenameNameChange={handleRenameGuestNameChange}
            onCommitRename={handleCommitRenameGuest}
            onTargetChange={(target) => handleUpdateParticipantTarget(idx, target)}
          />
        ))}
      </div>
      {totalExpenses !== undefined && totalExpenses > 0 && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => handleCalculateTargets(totalExpenses)}
            aria-label={t('participantsInput.calculateTargetsAria')}
            className="flex items-center gap-1.5 rounded-2xl border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
          >
            <MdAutoGraph className="text-sm" />
            {t('participantsInput.calculateTargets')}
          </button>
        </div>
      )}
    </div>
  );
}
