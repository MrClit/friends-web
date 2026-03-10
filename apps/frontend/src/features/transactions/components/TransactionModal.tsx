import { TransactionForm } from './TransactionForm';
import { TransactionTypeSelector } from './TransactionTypeSelector';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { FormErrorAlert } from '@/shared/components/FormErrorAlert';
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

export function TransactionModal() {
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
    isSaving,
    isDeleting,
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
              disabled={isSaving || isDeleting || showDiscardConfirm || showDeleteConfirm}
              aria-label={t('common.close')}
            />
          </DialogHeader>

          {/* Body with scroll */}
          <DialogBody className="flex-1 overflow-y-auto px-6 sm:px-8 py-2 custom-scrollbar">
            <div className="space-y-8 pb-6">
              <FormErrorAlert message={errorMessage} />

              {/* TransactionTypeSelector */}
              <div className="flex justify-center">
                <TransactionTypeSelector value={type} onChange={setType} />
              </div>

              {/* TransactionForm (without submit button) */}
              <TransactionForm
                fields={{
                  type,
                  title,
                  setTitle,
                  amount,
                  setAmount,
                  date,
                  setDate,
                  participantId,
                  setParticipantId,
                }}
                participants={event.participants}
                onSubmit={handleSubmit}
              />
            </div>
          </DialogBody>

          {/* Footer with buttons */}
          <DialogFooter className="px-6 sm:px-8 py-6 bg-slate-50/50 dark:bg-emerald-900/20 border-t border-emerald-100/50 dark:border-emerald-800/30">
            {/* Mobile layout: primary action first, secondary actions grouped */}
            <div className="flex flex-col gap-3 sm:hidden">
              <DialogPrimaryButton
                onClick={(e) => handleSubmit(e as unknown as React.FormEvent)}
                disabled={!canSubmit || isSaving || isDeleting}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3.5 rounded-2xl font-extrabold shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
              >
                {isSaving ? t('transactionModal.saving') : t('transactionModal.save')}
              </DialogPrimaryButton>

              {transaction ? (
                <div className="grid grid-cols-2 gap-3">
                  <DialogCloseButton
                    onClick={() => handleOpenChange(false)}
                    disabled={isSaving || isDeleting || showDiscardConfirm || showDeleteConfirm}
                    className="w-full px-6 py-3.5 rounded-2xl font-bold text-slate-600 dark:text-emerald-200 border border-slate-300/80 dark:border-emerald-700/70 bg-white/90 dark:bg-emerald-950/40 active:bg-slate-100 dark:active:bg-emerald-900/40 transition-colors"
                  >
                    {t('transactionModal.cancel')}
                  </DialogCloseButton>

                  <button
                    onClick={handleDelete}
                    className="w-full px-6 py-3.5 rounded-2xl font-bold text-white bg-red-500 hover:bg-red-600 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-300"
                    disabled={isSaving || isDeleting}
                  >
                    {isDeleting ? t('transactionModal.deleting') : t('transactionModal.delete')}
                  </button>
                </div>
              ) : (
                <DialogCloseButton
                  onClick={() => handleOpenChange(false)}
                  disabled={isSaving || isDeleting || showDiscardConfirm || showDeleteConfirm}
                  className="w-full px-6 py-3.5 rounded-2xl font-bold text-slate-600 dark:text-emerald-200 border border-slate-300/80 dark:border-emerald-700/70 bg-white/90 dark:bg-emerald-950/40 active:bg-slate-100 dark:active:bg-emerald-900/40 transition-colors"
                >
                  {t('transactionModal.cancel')}
                </DialogCloseButton>
              )}
            </div>

            {/* Desktop layout */}
            <div className="hidden sm:flex sm:w-full sm:items-center sm:gap-4">
              {transaction && (
                <button
                  onClick={handleDelete}
                  className="w-auto px-6 py-3.5 rounded-2xl font-bold text-white bg-red-500 hover:bg-red-600 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-300"
                  disabled={isSaving || isDeleting}
                >
                  {isDeleting ? t('transactionModal.deleting') : t('transactionModal.delete')}
                </button>
              )}

              {transaction && <div className="flex-1" />}

              <div className="flex w-auto flex-row gap-3">
                <DialogCloseButton
                  onClick={() => handleOpenChange(false)}
                  disabled={isSaving || isDeleting || showDiscardConfirm || showDeleteConfirm}
                  className="w-auto px-6 py-3.5 rounded-2xl font-bold text-slate-500 dark:text-emerald-300 hover:bg-slate-200/50 dark:hover:bg-emerald-800/50 transition-colors"
                >
                  {t('transactionModal.cancel')}
                </DialogCloseButton>

                <DialogPrimaryButton
                  onClick={(e) => handleSubmit(e as unknown as React.FormEvent)}
                  disabled={!canSubmit || isSaving || isDeleting}
                  className="w-auto bg-emerald-500 hover:bg-emerald-600 text-white px-8 sm:px-12 py-3.5 rounded-2xl font-extrabold shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
                >
                  {isSaving ? t('transactionModal.saving') : t('transactionModal.save')}
                </DialogPrimaryButton>
              </div>
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
