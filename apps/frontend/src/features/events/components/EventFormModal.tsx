import { Dialog, DialogBottomSheet, DialogTitle } from '@/shared/components/ui';
import ConfirmDialog from '../../../shared/components/ConfirmDialog';
import EventForm from './EventForm';
import type { Event, EventParticipant } from '../types';
import { useTranslation } from 'react-i18next';
import { useEventFormModal } from '../hooks/useEventFormModal';

interface EventFormModalProps {
  open: boolean;
  onClose: () => void;
  event?: Event; // If provided, modal is in edit mode
  onSubmit?: (event: { id?: string; title: string; participants: EventParticipant[] }) => void;
}

export default function EventFormModal({ open, onClose, event, onSubmit }: EventFormModalProps) {
  const { t } = useTranslation();
  const {
    title,
    setTitle,
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
  } = useEventFormModal({ open, event, onClose, onSubmit });

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogBottomSheet
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
          <div className="flex justify-between items-center mb-4">
            <DialogTitle>{event ? t('eventFormModal.editTitle') : t('eventFormModal.newTitle')}</DialogTitle>
            <button
              onClick={() => handleOpenChange(false)}
              className="text-2xl text-teal-400 hover:text-teal-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              disabled={isLoading || showConfirm}
              aria-label="Close"
            >
              &times;
            </button>
          </div>
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 rounded-lg text-red-800 dark:text-red-200 text-sm">
              {errorMessage}
            </div>
          )}
          <EventForm
            title={title}
            setTitle={setTitle}
            participants={participants}
            setParticipants={setParticipants}
            onSubmit={handleSubmit}
            canSubmit={canSubmit}
            isLoading={isLoading}
            mode={event ? 'edit' : 'create'}
          />
        </DialogBottomSheet>
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
