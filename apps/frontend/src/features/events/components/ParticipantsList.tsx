import { useTranslation } from 'react-i18next';
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
}

export function ParticipantsList({ participants, setParticipants, setParticipantReplacements }: ParticipantsListProps) {
  const { t } = useTranslation();
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
  } = useParticipantsList({
    participants,
    setParticipants,
    setParticipantReplacements,
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
        {participants.map((participant, idx) => (
          <ParticipantRow
            key={participant.id}
            participant={participant}
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
          />
        ))}
      </div>
    </div>
  );
}
