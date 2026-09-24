import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUpdateEvent } from '@/hooks/api/useEvents';
import { useModalForm } from '@/hooks/common';
import { getApiErrorMessage } from '@/shared/utils';
import type { EventParticipant } from '../types';
import { calculateSuggestedTargets } from '../utils/calculateSuggestedTargets';
import { sumContributionTargets } from '@/shared/utils/contributionTargets';
import { haveSameContributionTargets, withContributionTarget } from '../utils/contributionTargets';

interface UseContributionTargetsModalParams {
  open: boolean;
  eventId: string;
  participants: EventParticipant[];
  onClose: () => void;
}

/**
 * Draft-and-save lifecycle of the contribution targets modal.
 *
 * The draft is the full participants array (pot included, same order as the event) because the
 * endpoint replaces the array as a whole and "Calculate targets" rewrites every row at once.
 * `useModalForm` re-seeds the draft from `participants` whenever the modal opens; it would also do
 * so if the event were refetched while open, but nothing invalidates the event while this modal is
 * the one mutating it.
 */
export function useContributionTargetsModal({
  open,
  eventId,
  participants,
  onClose,
}: UseContributionTargetsModalParams) {
  const { t } = useTranslation('common');
  const [draft, setDraft] = useState<EventParticipant[]>(participants);
  const updateEvent = useUpdateEvent();

  const resetForm = useCallback(() => {
    setDraft(participants);
  }, [participants]);

  const isDirty = useMemo(() => open && !haveSameContributionTargets(draft, participants), [open, draft, participants]);

  const modal = useModalForm({ open, isDirty, resetForm, onClose });

  const setTarget = useCallback((index: number, target: number | undefined) => {
    setDraft((prev) =>
      prev.map((participant, i) => (i === index ? withContributionTarget(participant, target) : participant)),
    );
  }, []);

  const calculateTargets = useCallback((totalExpenses: number) => {
    setDraft((prev) => calculateSuggestedTargets(prev, totalExpenses));
  }, []);

  const handleSave = useCallback(() => {
    if (!isDirty) return;

    modal.setErrorMessage(null);
    updateEvent.mutate(
      { id: eventId, data: { participants: draft } },
      {
        onSuccess: () => {
          modal.closeAndReset();
        },
        onError: (error) => {
          modal.setErrorMessage(getApiErrorMessage(error, t));
        },
      },
    );
  }, [isDirty, modal, updateEvent, eventId, draft, t]);

  return {
    draft,
    targetTotal: sumContributionTargets(draft),
    hasEditableParticipants: draft.some((participant) => participant.type !== 'pot'),
    isDirty,
    isSaving: updateEvent.isPending,
    errorMessage: modal.errorMessage,
    showDiscardConfirm: modal.showDiscardConfirm,
    setTarget,
    calculateTargets,
    handleSave,
    handleOpenChange: modal.handleOpenChange,
    handleConfirmDiscard: modal.handleConfirmDiscard,
    handleCancelDiscard: modal.handleCancelDiscard,
  };
}
