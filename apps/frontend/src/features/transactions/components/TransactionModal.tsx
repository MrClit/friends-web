import TransactionForm from './TransactionForm';
import TransactionTypeSelector from './TransactionTypeSelector';
import ConfirmDialog from '../../../shared/components/ConfirmDialog';
import { useTranslation } from 'react-i18next';
import { useTransactionModalStore } from '@/shared/store/useTransactionModalStore';
import { useTransactionModal } from '../hooks/useTransactionModal';
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
  const { open, event, transaction, closeModal } = useTransactionModalStore();
  const { t } = useTranslation();

  const {
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
    showDeleteConfirm,
    showDiscardConfirm,
    isLoading,
    canSubmit,
    errorMessage,
    handleSubmit,
    handleDelete,
    handleConfirmDelete,
    handleCancelDelete,
    handleOpenChange,
    handleConfirmDiscard,
    handleCancelDiscard,
  } = useTransactionModal({
    open,
    event,
    transaction,
    onClose: closeModal,
  });

  if (!open || !event) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          onInteractOutside={(e) => {
            // Prevent main dialog from closing when ConfirmDialog is open
            if (showDiscardConfirm || showDeleteConfirm) {
              e.preventDefault();
            }
          }}
          onEscapeKeyDown={(e) => {
            // Prevent main dialog from closing with Escape when ConfirmDialog is open
            if (showDiscardConfirm || showDeleteConfirm) {
              e.preventDefault();
            }
          }}
        >
          {/* Header */}
          <DialogHeader className="px-8 pt-8 pb-4 flex justify-between items-center border-b border-transparent">
            <DialogTitle>{transaction ? t('transactionModal.editTitle') : t('transactionModal.addTitle')}</DialogTitle>
            <DialogCloseButton
              onClick={() => handleOpenChange(false)}
              disabled={isLoading || showDiscardConfirm || showDeleteConfirm}
              aria-label={t('common.close')}
            />
          </DialogHeader>

          {/* Body with scroll */}
          <DialogBody className="flex-1 overflow-y-auto px-6 sm:px-8 py-2 custom-scrollbar">
            <div className="space-y-8 pb-6">
              {/* Error message */}
              {errorMessage && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 rounded-lg text-red-800 dark:text-red-200 text-sm">
                  {errorMessage}
                </div>
              )}

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
                disabled={isLoading}
              >
                {isLoading ? t('transactionModal.deleting') : t('transactionModal.delete')}
              </button>
            )}

            {/* Spacer to push buttons to the right on desktop */}
            {transaction && <div className="hidden sm:block sm:flex-1" />}

            {/* Cancel + Save */}
            <div className="flex flex-col-reverse sm:flex-row w-full sm:w-auto gap-3">
              <DialogCloseButton
                onClick={() => handleOpenChange(false)}
                disabled={isLoading || showDiscardConfirm || showDeleteConfirm}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-bold text-slate-500 dark:text-emerald-300 hover:bg-slate-200/50 dark:hover:bg-emerald-800/50 transition-colors"
              >
                {t('transactionModal.cancel')}
              </DialogCloseButton>

              <DialogPrimaryButton
                onClick={(e) => handleSubmit(e as unknown as React.FormEvent)}
                disabled={!canSubmit || isLoading}
                className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white px-8 sm:px-12 py-3.5 rounded-2xl font-extrabold shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
              >
                {isLoading ? t('transactionModal.saving') : t('transactionModal.save')}
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

      {/* Discard changes confirmation dialog */}
      <ConfirmDialog
        open={showDiscardConfirm}
        title={t('transactionModal.discardTitle')}
        message={t('transactionModal.discardMessage')}
        confirmText={t('transactionModal.discard')}
        cancelText={t('transactionModal.cancel')}
        onConfirm={handleConfirmDiscard}
        onCancel={handleCancelDiscard}
      />
    </>
  );
}
