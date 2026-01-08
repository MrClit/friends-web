import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEventDetail } from '@/hooks/useEventDetail';
import { useModalState, useConfirmDialog } from '@/shared/hooks';
import { EventDetailHeader, EventKPIGrid, EventFormModal } from '@/features/events';
import TransactionModal from '../features/transactions/components/TransactionModal';
import TransactionsList from '../features/transactions/components/TransactionsList';
import FloatingActionButton from '../shared/components/FloatingActionButton';
import { ConfirmDialog } from '@/shared/components';

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { event, kpis, isLoading, error, handleEditSubmit, handleDelete, handleBack } = useEventDetail(id);

  // UI state management
  const editModal = useModalState();
  const transactionModal = useModalState();
  const deleteDialog = useConfirmDialog();

  // Validate id after all hooks
  if (!id) {
    return (
      <div className="flex flex-col items-center min-h-screen bg-linear-to-b from-teal-50 to-teal-100 dark:from-teal-900 dark:to-teal-950 p-4">
        <div className="text-center mt-10 text-red-400">{t('eventDetail.invalidId')}</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center min-h-screen bg-linear-to-b from-teal-50 to-teal-100 dark:from-teal-900 dark:to-teal-950 p-4">
        <div className="text-center mt-10 text-teal-400">{t('common.loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center min-h-screen bg-linear-to-b from-teal-50 to-teal-100 dark:from-teal-900 dark:to-teal-950 p-4">
        <div className="text-center mt-10 text-red-400">
          {t('common.error')}: {error.message}
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center min-h-screen bg-linear-to-b from-teal-50 to-teal-100 dark:from-teal-900 dark:to-teal-950 p-4">
        <div className="text-center mt-10">{t('eventDetail.notFound')}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-linear-to-b from-teal-50 to-teal-100 dark:from-teal-900 dark:to-teal-950 p-4">
      <EventDetailHeader
        eventId={event.id}
        eventTitle={event.title}
        onBack={handleBack}
        onEdit={editModal.open}
        onDelete={() => deleteDialog.confirm(handleDelete)}
      />

      <EventKPIGrid
        eventId={event.id}
        potBalance={kpis?.potBalance ?? 0}
        totalContributions={kpis?.totalContributions ?? 0}
        totalExpenses={kpis?.totalExpenses ?? 0}
        pendingToCompensate={kpis?.pendingToCompensate ?? 0}
      />

      {/* Lista de transacciones */}
      <TransactionsList event={event} />
      <FloatingActionButton onClick={transactionModal.open} translationKey="eventDetail.addTransaction" icon={'+'} />
      <EventFormModal
        open={editModal.isOpen}
        onClose={editModal.close}
        event={event}
        onSubmit={(data) => handleEditSubmit(data, editModal.close)}
      />
      <TransactionModal open={transactionModal.isOpen} onClose={transactionModal.close} event={event} />
      <ConfirmDialog
        open={deleteDialog.isOpen}
        title={t('eventDetail.deleteTitle')}
        message={t('eventDetail.deleteMessage')}
        confirmText={t('eventDetail.deleteConfirm')}
        cancelText={t('eventDetail.deleteCancel')}
        onConfirm={deleteDialog.handleConfirm}
        onCancel={deleteDialog.handleCancel}
      />
    </div>
  );
}
