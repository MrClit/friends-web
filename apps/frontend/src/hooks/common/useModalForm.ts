import { useCallback, useEffect, useState } from 'react';

interface UseModalFormOptions {
  open: boolean;
  isDirty: boolean;
  resetForm: () => void;
  onClose: () => void;
  /** Additional blocking conditions (e.g. delete confirm open) that prevent closing */
  extraBlockers?: boolean[];
}

export interface UseModalFormReturn {
  showDiscardConfirm: boolean;
  errorMessage: string | null;
  setErrorMessage: (message: string | null) => void;
  handleOpenChange: (isOpen: boolean) => void;
  handleConfirmDiscard: () => void;
  handleCancelDiscard: () => void;
  /** Resets confirm/error state, resets form, and closes the modal */
  closeAndReset: () => void;
}

/**
 * Shared modal form lifecycle hook.
 * Handles discard-confirmation flow, error messages, and form reset on open.
 */
export function useModalForm({
  open,
  isDirty,
  resetForm,
  onClose,
  extraBlockers = [],
}: UseModalFormOptions): UseModalFormReturn {
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open, resetForm]);

  const closeAndReset = useCallback(() => {
    setShowDiscardConfirm(false);
    setErrorMessage(null);
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      const isBlocked = showDiscardConfirm || extraBlockers.some(Boolean);
      if (!isOpen && !isBlocked) {
        if (isDirty) {
          setShowDiscardConfirm(true);
        } else {
          closeAndReset();
        }
      }
    },
    [isDirty, showDiscardConfirm, extraBlockers, closeAndReset],
  );

  const handleConfirmDiscard = useCallback(() => {
    closeAndReset();
  }, [closeAndReset]);

  const handleCancelDiscard = useCallback(() => {
    setShowDiscardConfirm(false);
  }, []);

  return {
    showDiscardConfirm,
    errorMessage,
    setErrorMessage,
    handleOpenChange,
    handleConfirmDiscard,
    handleCancelDiscard,
    closeAndReset,
  };
}
