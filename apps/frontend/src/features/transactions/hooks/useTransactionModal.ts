import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreateTransaction, useUpdateTransaction, useDeleteTransaction } from '@/hooks/api/useTransactions';
import type { Transaction, PaymentType } from '../types';
import type { Event } from '@/features/events/types';

/**
 * Helper function to check if form data has changed from original transaction
 */
function checkIsDirty(
  transaction: Transaction | null,
  type: PaymentType,
  title: string,
  amount: string,
  date: string,
  participantId: string,
  open: boolean,
): boolean {
  if (!open) return false;

  const today = new Date().toISOString().slice(0, 10);

  if (!transaction) {
    // Create mode: check if any field is non-default
    return (
      type !== 'contribution' ||
      title.trim() !== '' ||
      amount.trim() !== '' ||
      participantId.trim() !== '' ||
      date !== today
    );
  }

  // Edit mode: check if any field changed
  return (
    type !== transaction.paymentType ||
    title.trim() !== transaction.title.trim() ||
    amount !== transaction.amount.toString() ||
    participantId !== (transaction.participantId || '') ||
    date !== transaction.date.slice(0, 10)
  );
}

interface UseTransactionModalProps {
  open: boolean;
  event: Event | null;
  transaction: Transaction | null;
  onClose: () => void;
}

interface UseTransactionModalReturn {
  // Form state
  type: PaymentType;
  setType: (type: PaymentType) => void;
  title: string;
  setTitle: (title: string) => void;
  amount: string;
  setAmount: (amount: string) => void;
  date: string;
  setDate: (date: string) => void;
  participantId: string;
  setParticipantId: (id: string) => void;

  // Confirmation dialogs
  showDeleteConfirm: boolean;
  showDiscardConfirm: boolean;

  // Computed
  isLoading: boolean;
  canSubmit: boolean;
  isDirty: boolean;
  errorMessage: string | null;

  // Handlers
  handleSubmit: (e: React.FormEvent) => void;
  handleDelete: () => void;
  handleConfirmDelete: () => void;
  handleCancelDelete: () => void;
  handleOpenChange: (isOpen: boolean) => void;
  handleConfirmDiscard: () => void;
  handleCancelDiscard: () => void;
}

export function useTransactionModal({
  open,
  event,
  transaction,
  onClose,
}: UseTransactionModalProps): UseTransactionModalReturn {
  // Form state
  const [type, setType] = useState<PaymentType>('contribution');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [participantId, setParticipantId] = useState('');

  // Confirmation dialogs state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Error state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { t } = useTranslation();

  // Mutations
  const createTransaction = useCreateTransaction(event?.id ?? '');
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();

  // Centralized reset function to avoid duplication
  const resetForm = useCallback(() => {
    if (transaction) {
      // Edit mode: populate with transaction data
      setType(transaction.paymentType);
      setTitle(transaction.title);
      setAmount(transaction.amount.toString());
      setDate(transaction.date.slice(0, 10));
      setParticipantId(transaction.participantId || '');
    } else {
      // Create mode: reset to default values
      setType('contribution');
      setTitle('');
      setAmount('');
      setDate(new Date().toISOString().slice(0, 10));
      setParticipantId('');
    }
    setErrorMessage(null);
  }, [transaction]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open, resetForm]);

  // Computed values (must be declared before handlers that use them)
  const canSubmit = useMemo(
    () => !!title.trim() && !!amount.trim() && !!date && !!participantId,
    [title, amount, date, participantId],
  );

  const isDirty = useMemo(
    () => checkIsDirty(transaction, type, title, amount, date, participantId, open),
    [transaction, type, title, amount, date, participantId, open],
  );

  const isLoading = createTransaction.isPending || updateTransaction.isPending || deleteTransaction.isPending;

  // Handlers
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSubmit || !event) return;

      setErrorMessage(null);

      if (transaction) {
        // Update existing transaction
        updateTransaction.mutate(
          {
            id: transaction.id,
            data: {
              title: title.trim(),
              paymentType: type,
              amount: parseFloat(amount),
              participantId,
              date,
            },
          },
          {
            onSuccess: () => {
              setShowDiscardConfirm(false);
              resetForm();
              onClose();
            },
            onError: (error) => {
              const message = error instanceof Error ? error.message : t('common.errorLoading');
              setErrorMessage(message);
            },
          },
        );
      } else {
        // Create new transaction
        createTransaction.mutate(
          {
            title: title.trim(),
            paymentType: type,
            amount: parseFloat(amount),
            participantId,
            date,
          },
          {
            onSuccess: () => {
              setShowDiscardConfirm(false);
              resetForm();
              onClose();
            },
            onError: (error) => {
              const message = error instanceof Error ? error.message : t('common.errorLoading');
              setErrorMessage(message);
            },
          },
        );
      }
    },
    [
      canSubmit,
      event,
      transaction,
      title,
      type,
      amount,
      participantId,
      date,
      updateTransaction,
      createTransaction,
      resetForm,
      onClose,
      t,
    ],
  );

  const handleDelete = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (transaction) {
      deleteTransaction.mutate(transaction.id, {
        onSuccess: () => {
          setShowDeleteConfirm(false);
          setShowDiscardConfirm(false);
          resetForm();
          onClose();
        },
        onError: (error) => {
          const message = error instanceof Error ? error.message : t('common.errorLoading');
          setErrorMessage(message);
        },
      });
    }
  }, [transaction, deleteTransaction, resetForm, onClose, t]);

  const handleCancelDelete = useCallback(() => {
    setShowDeleteConfirm(false);
  }, []);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      // Don't allow closing if ConfirmDialog is already open
      if (!isOpen && !showDiscardConfirm && !showDeleteConfirm) {
        if (isDirty) {
          setShowDiscardConfirm(true);
        } else {
          resetForm();
          onClose();
        }
      }
    },
    [isDirty, showDiscardConfirm, showDeleteConfirm, resetForm, onClose],
  );

  const handleConfirmDiscard = useCallback(() => {
    setShowDiscardConfirm(false);
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleCancelDiscard = useCallback(() => {
    setShowDiscardConfirm(false);
  }, []);

  return {
    // Form state
    type,
    setType,
    title,
    setTitle,
    amount,
    setAmount,
    date,
    setDate,
    participantId,
    setParticipantId,

    // Confirmation dialogs
    showDeleteConfirm,
    showDiscardConfirm,

    // Computed
    isLoading,
    canSubmit,
    isDirty,
    errorMessage,

    // Handlers
    handleSubmit,
    handleDelete,
    handleConfirmDelete,
    handleCancelDelete,
    handleOpenChange,
    handleConfirmDiscard,
    handleCancelDiscard,
  };
}
