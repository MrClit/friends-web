import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
  DialogCloseButton,
  DialogBody,
  DialogPrimaryButton,
} from '@/shared/components/ui';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { FormErrorAlert } from '@/shared/components/FormErrorAlert';
import { EventForm } from './EventForm';
import { useTranslation } from 'react-i18next';
import { useEventFormModal } from '../hooks/useEventFormModal';
import { useEventFormModalStore } from '@/shared/store/useEventFormModalStore';

export function EventFormModal() {
  const { t } = useTranslation(['events', 'common']);
  const { open, closeModal, eventId } = useEventFormModalStore();

  const {
    title,
    setTitle,
    description,
    setDescription,
    participants,
    setParticipants,
    setParticipantReplacements,
    showConfirm,
    errorMessage,
    isLoading,
    canSubmit,
    isEditMode,
    handleOpenChange,
    handleConfirmClose,
    handleCancelClose,
    handleSubmit,
    icon,
    setIcon,
  } = useEventFormModal({
    open,
    eventId,
    onClose: closeModal,
  });
  const submitText = isLoading ? t('eventForm.saving') : isEditMode ? t('eventForm.update') : t('eventForm.create');

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          onInteractOutside={(e) => {
            if (showConfirm) {
              e.preventDefault();
            }
          }}
          onEscapeKeyDown={(e) => {
            if (showConfirm) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader className="px-8 pt-8 pb-4 flex justify-between items-center border-b border-transparent">
            <DialogTitle>{isEditMode ? t('eventFormModal.editTitle') : t('eventFormModal.newTitle')}</DialogTitle>
            <DialogCloseButton
              onClick={() => handleOpenChange(false)}
              disabled={isLoading || showConfirm}
              aria-label={t('close', { ns: 'common' })}
            />
          </DialogHeader>

          <DialogBody>
            <div>
              <FormErrorAlert message={errorMessage} />

              <EventForm
                fields={{
                  title,
                  setTitle,
                  description,
                  setDescription,
                  participants,
                  setParticipants,
                  setParticipantReplacements,
                  icon,
                  setIcon,
                }}
                onSubmit={handleSubmit}
              />
            </div>
          </DialogBody>

          <DialogFooter className="px-6 sm:px-8 py-6 bg-slate-50 dark:bg-emerald-900/20 border-t border-emerald-100 dark:border-emerald-800/30">
            <div className="flex flex-col gap-3 sm:hidden">
              <DialogPrimaryButton
                form="event-form"
                type="submit"
                disabled={!canSubmit || isLoading}
                className="w-full"
              >
                {submitText}
              </DialogPrimaryButton>

              <DialogCloseButton
                onClick={() => handleOpenChange(false)}
                disabled={isLoading || showConfirm}
                className="w-full px-6 py-3.5 rounded-2xl font-bold text-slate-600 dark:text-emerald-200 border border-slate-300/80 dark:border-emerald-700/70 bg-white/90 dark:bg-emerald-950/40 active:bg-slate-100 dark:active:bg-emerald-900/40 transition-colors"
              >
                {t('eventFormModal.cancel')}
              </DialogCloseButton>
            </div>

            <div className="hidden sm:flex sm:w-full sm:items-center sm:justify-end sm:gap-3">
              <DialogCloseButton onClick={() => handleOpenChange(false)} disabled={isLoading || showConfirm}>
                {t('eventFormModal.cancel')}
              </DialogCloseButton>

              <DialogPrimaryButton form="event-form" type="submit" disabled={!canSubmit || isLoading}>
                {submitText}
              </DialogPrimaryButton>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={showConfirm}
        title={isEditMode ? t('eventFormModal.discardEditTitle') : t('eventFormModal.discardNewTitle')}
        message={isEditMode ? t('eventFormModal.discardEditMessage') : t('eventFormModal.discardNewMessage')}
        confirmText={t('eventFormModal.discard')}
        cancelText={t('eventFormModal.cancel')}
        onConfirm={handleConfirmClose}
        onCancel={handleCancelClose}
      />
    </>
  );
}
