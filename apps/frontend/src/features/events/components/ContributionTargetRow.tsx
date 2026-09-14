import { memo, type Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/shared/components/Avatar';
import { cn } from '@/shared/utils/cn';
import type { GuestParticipant, UserParticipant } from '@/api/types';
import { getParticipantAvatar, getParticipantName } from '../utils/participants';
import { parseContributionTargetInput } from '../utils/contributionTargets';

interface ContributionTargetRowProps {
  participant: UserParticipant | GuestParticipant;
  inputId: string;
  onTargetChange: (target: number | undefined) => void;
  inputRef?: Ref<HTMLInputElement>;
}

export const ContributionTargetRow = memo(function ContributionTargetRow({
  participant,
  inputId,
  onTargetChange,
  inputRef,
}: ContributionTargetRowProps) {
  const { t } = useTranslation('eventDetail');
  const participantName = getParticipantName(participant, t);
  const participantEmail = participant.type === 'user' ? participant.email : undefined;
  const target = participant.contributionTarget ?? 0;

  return (
    <li className="flex items-center justify-between gap-3 rounded-2xl p-3 transition-colors hover:bg-slate-50 dark:hover:bg-emerald-900/10">
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
        <div className="min-w-0">
          <p className="truncate text-sm touch:text-base font-bold leading-tight text-slate-900 dark:text-white">
            {participantName}
          </p>
          {participantEmail && (
            <p className="truncate text-xs text-slate-500 dark:text-emerald-400">{participantEmail}</p>
          )}
        </div>
      </div>

      <div className="relative w-32 shrink-0">
        <input
          ref={inputRef}
          id={inputId}
          type="number"
          min="0"
          step="0.01"
          value={target === 0 ? '' : target}
          onChange={(e) => onTargetChange(parseContributionTargetInput(e.target.value))}
          placeholder={t('targets.modal.targetPlaceholder')}
          className={cn(
            'w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2 pl-3 pr-8 text-sm font-medium text-slate-900',
            'outline-none transition-colors placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-emerald-500',
            'dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-white dark:placeholder:text-emerald-700',
            // The spinners sit exactly where the € glyph is, and the amount is typed anyway.
            '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
          )}
          aria-label={t('targets.modal.targetAria', { name: participantName })}
        />
        <span
          aria-hidden
          // Sits inside the field's box, so it tracks the field's size rather than its own.
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm touch:text-base font-bold text-slate-400 dark:text-emerald-300/70"
        >
          €
        </span>
      </div>
    </li>
  );
});
