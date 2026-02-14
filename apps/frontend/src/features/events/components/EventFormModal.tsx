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
import ConfirmDialog from '../../../shared/components/ConfirmDialog';
import EventForm from './EventForm';
import { useTranslation } from 'react-i18next';
import { useEventFormModal } from '../hooks/useEventFormModal';
import useEventFormModalStore from '@/shared/store/useEventFormModalStore';

export default function EventFormModal() {
  const { t } = useTranslation();
  const { open, closeModal, event, onSubmit } = useEventFormModalStore();

  const {
    title,
    setTitle,
    description,
    setDescription,
    participants,
    setParticipants,
    showConfirm,
    errorMessage,
    isLoading,
    canSubmit,
    handleOpenChange,
    handleConfirmClose,
    handleCancelClose,
    handleSubmit,
    icon,
    setIcon,
  } = useEventFormModal({
    open: open,
    event: event ?? undefined,
    onClose: closeModal,
    onSubmit: onSubmit,
  });

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          onInteractOutside={(e) => {
            // Prevent main dialog from closing when ConfirmDialog is open
            if (showConfirm) {
              e.preventDefault();
            }
          }}
          onEscapeKeyDown={(e) => {
            // Prevent main dialog from closing with Escape when ConfirmDialog is open
            if (showConfirm) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader className="px-8 pt-8 pb-4 flex justify-between items-center border-b border-transparent">
            <DialogTitle>{event ? t('eventFormModal.editTitle') : t('eventFormModal.newTitle')}</DialogTitle>
            <DialogCloseButton
              onClick={() => handleOpenChange(false)}
              disabled={isLoading || showConfirm}
              aria-label={t('common.close')}
            />
          </DialogHeader>

          <DialogBody>
            <div>
              {errorMessage && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 rounded-lg text-red-800 dark:text-red-200 text-sm">
                  {errorMessage}
                </div>
              )}

              <EventForm
                title={title}
                setTitle={setTitle}
                description={description}
                setDescription={setDescription}
                participants={participants}
                setParticipants={setParticipants}
                onSubmit={handleSubmit}
                icon={icon}
                setIcon={setIcon}
              />
            </div>
          </DialogBody>

          <DialogFooter className="px-8 py-6 bg-slate-50 dark:bg-emerald-900/20 flex items-center justify-end gap-3 border-t border-emerald-100 dark:border-emerald-800/30">
            <DialogCloseButton onClick={() => handleOpenChange(false)} disabled={isLoading || showConfirm}>
              {t('eventFormModal.cancel')}
            </DialogCloseButton>
            <DialogPrimaryButton form="event-form" type="submit" disabled={!canSubmit || isLoading}>
              {isLoading ? t('eventForm.saving') : event ? t('eventForm.update') : t('eventForm.create')}
            </DialogPrimaryButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={showConfirm}
        title={event ? t('eventFormModal.discardEditTitle') : t('eventFormModal.discardNewTitle')}
        message={event ? t('eventFormModal.discardEditMessage') : t('eventFormModal.discardNewMessage')}
        confirmText={t('eventFormModal.discard')}
        cancelText={t('eventFormModal.cancel')}
        onConfirm={handleConfirmClose}
        onCancel={handleCancelClose}
      />
    </>
  );
}
