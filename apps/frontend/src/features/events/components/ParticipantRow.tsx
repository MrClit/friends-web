import { memo } from 'react';
import { MdCheck, MdClose, MdDelete, MdEdit, MdSwapHoriz } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils/cn';
import { Avatar } from '@/shared/components/Avatar';
import { ParticipantsCombobox } from './ParticipantsCombobox';
import type { EventParticipant } from '../types';
import { getParticipantAvatar, getParticipantName } from '../utils/participants';

interface ParticipantRowProps {
  participant: EventParticipant;
  participantIndex: number;
  isFirst: boolean;
  existingParticipants: EventParticipant[];
  isRenamingGuest: boolean;
  isReplacingGuest: boolean;
  renamingGuestName: string;
  replaceInputValue: string;
  onDelete: () => void;
  onStartReplace: () => void;
  onCancelReplace: () => void;
  onReplaceWithUser: (participant: EventParticipant) => void;
  onReplaceInputChange: (value: string) => void;
  onStartRename: () => void;
  onCancelRename: () => void;
  onRenameNameChange: (name: string) => void;
  onCommitRename: () => void;
  onTargetChange: (target: number | undefined) => void;
}

export const ParticipantRow = memo(function ParticipantRow({
  participant,
  participantIndex,
  isFirst,
  existingParticipants,
  isRenamingGuest,
  isReplacingGuest,
  renamingGuestName,
  replaceInputValue,
  onDelete,
  onStartReplace,
  onCancelReplace,
  onReplaceWithUser,
  onReplaceInputChange,
  onStartRename,
  onCancelRename,
  onRenameNameChange,
  onCommitRename,
  onTargetChange,
}: ParticipantRowProps) {
  const { t } = useTranslation();
  const isGuest = participant.type === 'guest';
  const isPot = participant.type === 'pot';
  const participantName = getParticipantName(participant, t);
  const currentTarget = participant.type !== 'pot' ? (participant.contributionTarget ?? 0) : 0;

  return (
    <div>
      <div
        className={cn(
          'flex flex-col gap-2 rounded-2xl p-3',
          isFirst
            ? 'border border-emerald-100/50 bg-emerald-50/50 dark:border-emerald-800/30 dark:bg-emerald-900/20'
            : 'transition-colors hover:bg-slate-50 dark:hover:bg-emerald-900/10',
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar
              avatar={getParticipantAvatar(participant)}
              name={participantName}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full border-2 border-emerald-600/30 bg-emerald-600/10 font-bold',
                'object-cover dark:border-emerald-800/30 dark:bg-emerald-900/20 dark:text-white',
              )}
              imageClassName="w-10 h-10"
            />

            {isRenamingGuest ? (
              <div className="flex min-w-0 items-center gap-2">
                <input
                  type="text"
                  value={renamingGuestName}
                  onChange={(e) => onRenameNameChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      onCommitRename();
                    }
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      onCancelRename();
                    }
                  }}
                  onBlur={onCommitRename}
                  className={cn(
                    'w-full min-w-40 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-900',
                    'outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20',
                    'dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-white',
                  )}
                  aria-label={t('participantsInput.renameInputAria')}
                  autoFocus
                />

                <button
                  type="button"
                  className={cn(
                    'rounded-lg p-1.5 text-emerald-700 transition-colors hover:bg-emerald-100 hover:text-emerald-800',
                    'dark:text-emerald-300 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-200',
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={onCommitRename}
                  aria-label={t('participantsInput.saveRenameAria')}
                >
                  <MdCheck className="text-lg" />
                </button>

                <button
                  type="button"
                  className={cn(
                    'rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700',
                    'dark:text-emerald-300 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-100',
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={onCancelRename}
                  aria-label={t('participantsInput.cancelRenameAria')}
                >
                  <MdClose className="text-lg" />
                </button>
              </div>
            ) : (
              <p className="truncate text-sm font-bold leading-tight text-slate-900 dark:text-white">
                {participantName}
              </p>
            )}
          </div>

          {!isFirst && (
            <div className="flex items-center gap-1">
              {isGuest && !isRenamingGuest && (
                <>
                  <button
                    type="button"
                    className={cn(
                      'rounded-xl p-2 text-slate-400 transition-colors hover:bg-teal-50 hover:text-teal-600',
                      'dark:hover:bg-teal-900/20 dark:hover:text-teal-400',
                    )}
                    onClick={onStartReplace}
                    aria-label={t('participantsInput.replaceAria')}
                  >
                    <MdSwapHoriz className="text-xl" />
                  </button>

                  <button
                    type="button"
                    className={cn(
                      'rounded-xl p-2 text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-700',
                      'dark:hover:bg-emerald-900/20 dark:hover:text-emerald-300',
                    )}
                    onClick={onStartRename}
                    aria-label={t('participantsInput.renameAria')}
                  >
                    <MdEdit className="text-xl" />
                  </button>
                </>
              )}

              <button
                type="button"
                className={cn(
                  'rounded-xl p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500',
                  'dark:hover:bg-red-900/20',
                )}
                onClick={onDelete}
                aria-label={t('participantsInput.deleteAria')}
              >
                <MdDelete className="text-xl" />
              </button>
            </div>
          )}
        </div>

        {/* Contribution target input for non-pot participants */}
        {!isPot && (
          <div className="flex items-center gap-2 pl-13">
            <label
              htmlFor={`target-${participantIndex}`}
              className="text-xs font-semibold text-slate-600 dark:text-slate-400"
            >
              {t('participantsInput.targetLabel')}
            </label>
            <div className="relative w-28">
              <input
                id={`target-${participantIndex}`}
                type="number"
                min="0"
                step="1"
                value={currentTarget === 0 ? '' : currentTarget}
                onChange={(e) => {
                  const val = e.target.value.trim();
                  if (val === '') {
                    onTargetChange(undefined);
                    return;
                  }

                  const parsedValue = Number(val);
                  if (!Number.isFinite(parsedValue)) {
                    onTargetChange(undefined);
                    return;
                  }

                  onTargetChange(parsedValue < 0 ? 0 : parsedValue);
                }}
                placeholder={t('participantsInput.targetPlaceholder')}
                className={cn(
                  'w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2 pl-3 pr-8 text-sm font-medium text-slate-900',
                  'outline-none transition-all placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-emerald-500',
                  'dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-white dark:placeholder:text-emerald-700',
                )}
                aria-label={t('participantsInput.targetAria')}
              />
              <span
                aria-hidden
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 dark:text-emerald-300/70"
              >
                €
              </span>
            </div>
          </div>
        )}
      </div>

      {isReplacingGuest && (
        <div className="mt-2 pl-12 sm:pl-13">
          <div className="flex items-center gap-2">
            <ParticipantsCombobox
              onSelect={onReplaceWithUser}
              existingParticipants={existingParticipants}
              inputValue={replaceInputValue}
              onInputChange={onReplaceInputChange}
              allowCreateGuest={false}
              autoFocus
            />
            <button
              type="button"
              className={cn(
                'rounded-xl border border-slate-300/80 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition-colors',
                'hover:bg-slate-100 dark:border-emerald-700/70 dark:bg-emerald-950/30 dark:text-emerald-200 dark:hover:bg-emerald-900/40',
              )}
              onClick={onCancelReplace}
            >
              {t('participantsInput.cancelReplace')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
