import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAutoGraph } from 'react-icons/md';
import {
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPrimaryButton,
  DialogTitle,
} from '@/shared/components/ui';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { FormErrorAlert } from '@/shared/components/FormErrorAlert';
import { formatAmount } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';
import type { EventParticipant } from '../types';
import { useContributionTargetsModal } from '../hooks/useContributionTargetsModal';
import { ContributionTargetRow } from './ContributionTargetRow';

interface ContributionTargetsModalProps {
  open: boolean;
  eventId: string;
  participants: EventParticipant[];
  totalExpenses: number;
  onClose: () => void;
}

/**
 * Edits the contribution target of every participant at once. Saving sends the full participants
 * array in one request; closing with unsaved changes asks for confirmation.
 */
export function ContributionTargetsModal({
  open,
  eventId,
  participants,
  totalExpenses,
  onClose,
}: ContributionTargetsModalProps) {
  const { t } = useTranslation(['eventDetail', 'common']);
  const contentRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const {
    draft,
    targetTotal,
    hasEditableParticipants,
    isDirty,
    isSaving,
    errorMessage,
    showDiscardConfirm,
    setTarget,
    calculateTargets,
    handleSave,
    handleOpenChange,
    handleConfirmDiscard,
    handleCancelDiscard,
  } = useContributionTargetsModal({ open, eventId, participants, onClose });

  const canCalculate = totalExpenses > 0 && hasEditableParticipants;
  const isCloseDisabled = isSaving || showDiscardConfirm;
  const cancelText = t('targets.modal.cancel');
  const saveText = isSaving ? t('targets.modal.saving') : t('targets.modal.save');
  const firstEditableId = draft.find((participant) => participant.type !== 'pot')?.id;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          ref={contentRef}
          onOpenAutoFocus={(e) => {
            // Radix would land on the header ×; the first target field (or the content, when there
            // is none) is where the work starts.
            e.preventDefault();
            (firstInputRef.current ?? contentRef.current)?.focus();
          }}
          onInteractOutside={(e) => {
            if (showDiscardConfirm) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (showDiscardConfirm) e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>{t('targets.modal.title')}</DialogTitle>
            <DialogCloseButton disabled={isCloseDisabled} aria-label={t('close', { ns: 'common' })} />
          </DialogHeader>
          <DialogDescription className="sr-only">{t('targets.modal.description')}</DialogDescription>

          <DialogBody>
            <FormErrorAlert message={errorMessage} />

            {hasEditableParticipants ? (
              <>
                <ul className="flex flex-col gap-1">
                  {draft.map((participant, index) => {
                    if (participant.type === 'pot') return null;

                    return (
                      <ContributionTargetRow
                        key={participant.id}
                        participant={participant}
                        inputId={`contribution-target-${participant.id}`}
                        inputRef={participant.id === firstEditableId ? firstInputRef : undefined}
                        onTargetChange={(target) => setTarget(index, target)}
                      />
                    );
                  })}
                </ul>

                {canCalculate && (
                  <div className="flex justify-end pt-3">
                    <button
                      type="button"
                      onClick={() => calculateTargets(totalExpenses)}
                      aria-label={t('targets.modal.calculateAria')}
                      className={cn(
                        'flex items-center gap-1.5 rounded-2xl border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold text-emerald-700',
                        'cursor-pointer transition-colors hover:bg-emerald-50',
                        'dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:bg-emerald-900/30',
                      )}
                    >
                      <MdAutoGraph className="text-sm" aria-hidden="true" />
                      {t('targets.modal.calculate')}
                    </button>
                  </div>
                )}

                <dl
                  aria-live="polite"
                  className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm dark:bg-emerald-900/20"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {t('targets.modal.totalLabel')}
                    </dt>
                    <dd className="font-bold text-slate-900 dark:text-white">{formatAmount(targetTotal)}</dd>
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0 text-right">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {t('targets.modal.expensesLabel')}
                    </dt>
                    <dd className="font-bold text-rose-700 dark:text-rose-400">{formatAmount(totalExpenses)}</dd>
                  </div>
                </dl>
              </>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('targets.modal.empty')}</p>
            )}
          </DialogBody>

          <DialogFooter className="px-6 sm:px-8 py-6 bg-slate-50 dark:bg-emerald-900/20 border-t border-emerald-100 dark:border-emerald-800/30">
            <div className="flex flex-col gap-3 sm:hidden">
              <DialogPrimaryButton onClick={handleSave} disabled={!isDirty || isSaving} className="w-full">
                {saveText}
              </DialogPrimaryButton>

              <DialogCloseButton
                disabled={isCloseDisabled}
                className="w-full px-6 py-3.5 rounded-2xl font-bold text-slate-600 dark:text-emerald-200 border border-slate-300/80 dark:border-emerald-700/70 bg-white/90 dark:bg-emerald-950/40 active:bg-slate-100 dark:active:bg-emerald-900/40 transition-colors"
              >
                {cancelText}
              </DialogCloseButton>
            </div>

            <div className="hidden sm:flex sm:w-full sm:items-center sm:justify-end sm:gap-3">
              <DialogCloseButton disabled={isCloseDisabled}>{cancelText}</DialogCloseButton>

              <DialogPrimaryButton onClick={handleSave} disabled={!isDirty || isSaving}>
                {saveText}
              </DialogPrimaryButton>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showDiscardConfirm}
        title={t('targets.modal.discardTitle')}
        message={t('targets.modal.discardMessage')}
        confirmText={t('targets.modal.discard')}
        cancelText={cancelText}
        onConfirm={handleConfirmDiscard}
        onCancel={handleCancelDiscard}
      />
    </>
  );
}
