import { useEffect, useState } from 'react';
import TransactionForm from './TransactionForm';
import type { PaymentType } from '../types';
import TransactionTypeSelector from './TransactionTypeSelector';
import ConfirmDialog from '../../../shared/components/ConfirmDialog';
import { useTranslation } from 'react-i18next';
import { useCreateTransaction, useUpdateTransaction, useDeleteTransaction } from '../../../hooks/api/useTransactions';
import { useTransactionModalStore } from '@/shared/store/useTransactionModalStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogCloseButton,
  DialogPrimaryButton,
} from '@/shared/components/ui';

export default function TransactionModal() {
  const { open, event, transaction, showDeleteConfirm, closeModal, setShowDeleteConfirm } = useTransactionModalStore();
  const [type, setType] = useState<PaymentType>('contribution');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [participantId, setParticipantId] = useState('');

  const { t } = useTranslation();

  // React Query mutations
  const createTransaction = useCreateTransaction(event?.id ?? '');
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, closeModal]);

  useEffect(() => {
    if (transaction) {
      setType(transaction.paymentType);
      setTitle(transaction.title);
      setAmount(transaction.amount.toString());
      setDate(transaction.date.slice(0, 10));
      setParticipantId(transaction.participantId || '');
    } else {
      setType('contribution');
      setTitle('');
      setAmount('');
      setDate(new Date().toISOString().slice(0, 10));
      setParticipantId('');
    }
  }, [transaction, open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !amount || !date || !participantId) return;
    if (transaction) {
      // Update existing transaction
      updateTransaction.mutate(
        {
          id: transaction.id,
          data: {
            title,
            paymentType: type,
            amount: parseFloat(amount),
            participantId: participantId,
            date,
          },
        },
        {
          onSuccess: () => {
            closeModal();
          },
        },
      );
      return;
    }
    // Create new transaction
    createTransaction.mutate(
      {
        title,
        paymentType: type,
        amount: parseFloat(amount),
        participantId: participantId,
        date,
      },
      {
        onSuccess: () => {
          closeModal();
        },
      },
    );
  }

  function handleDelete() {
    setShowDeleteConfirm(true);
  }

  function handleConfirmDelete() {
    if (transaction) {
      deleteTransaction.mutate(transaction.id, {
        onSuccess: () => {
          setShowDeleteConfirm(false);
          closeModal();
        },
      });
    }
  }

  function handleCancelDelete() {
    setShowDeleteConfirm(false);
  }

  if (!open || !event) return null;

  const isLoading = createTransaction.isPending || updateTransaction.isPending || deleteTransaction.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && closeModal()}>
        <DialogContent>
          {/* Header */}
          <DialogHeader className="px-8 pt-8 pb-4 flex justify-between items-center border-b border-transparent">
            <DialogTitle>{transaction ? t('transactionModal.editTitle') : t('transactionModal.addTitle')}</DialogTitle>
            <DialogCloseButton onClick={closeModal} disabled={isLoading} aria-label={t('common.close')} />
          </DialogHeader>

          {/* Body with scroll */}
          <DialogBody className="flex-1 overflow-y-auto px-6 sm:px-8 py-2 custom-scrollbar">
            <div className="space-y-8 pb-6">
              {/* TransactionTypeSelector */}
              <div className="flex justify-center">
                <TransactionTypeSelector value={type} onChange={setType} />
              </div>

              {/* TransactionForm (without submit button) */}
              <TransactionForm
                type={type}
                title={title}
                setTitle={setTitle}
                amount={amount}
                setAmount={setAmount}
                date={date}
                setDate={setDate}
                from={participantId}
                setParticipantId={setParticipantId}
                participants={event.participants}
                onSubmit={handleSubmit}
              />
            </div>
          </DialogBody>

          {/* Footer with buttons */}
          <DialogFooter className="px-6 sm:px-8 py-6 bg-slate-50/50 dark:bg-emerald-900/20 flex flex-col-reverse sm:flex-row items-center gap-3 sm:gap-4 border-t border-emerald-100/50 dark:border-emerald-800/30">
            {/* Delete button (conditional) */}
            {transaction && (
              <button
                onClick={handleDelete}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-bold text-white bg-red-500 hover:bg-red-600 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-300"
                disabled={deleteTransaction.isPending}
              >
                {deleteTransaction.isPending ? t('transactionModal.deleting') : t('transactionModal.delete')}
              </button>
            )}

            {/* Spacer to push buttons to the right on desktop */}
            {transaction && <div className="hidden sm:block sm:flex-1" />}

            {/* Cancel + Save */}
            <div className="flex flex-col-reverse sm:flex-row w-full sm:w-auto gap-3">
              <DialogCloseButton
                onClick={closeModal}
                disabled={isLoading}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-bold text-slate-500 dark:text-emerald-300 hover:bg-slate-200/50 dark:hover:bg-emerald-800/50 transition-colors"
              >
                {t('transactionModal.cancel')}
              </DialogCloseButton>

              <DialogPrimaryButton
                onClick={(e) => handleSubmit(e as unknown as React.FormEvent)}
                disabled={
                  !title ||
                  !amount ||
                  !date ||
                  !participantId ||
                  createTransaction.isPending ||
                  updateTransaction.isPending
                }
                className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white px-8 sm:px-12 py-3.5 rounded-2xl font-extrabold shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
              >
                {createTransaction.isPending || updateTransaction.isPending
                  ? t('transactionModal.saving')
                  : t('transactionModal.save')}
              </DialogPrimaryButton>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title={t('transactionModal.deleteTitle')}
        message={t('transactionModal.deleteMessage')}
        confirmText={t('transactionModal.delete')}
        cancelText={t('transactionModal.cancel')}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </>
  );
}
