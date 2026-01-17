import ProtectedLayout from './ProtectedLayout';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEventDetail } from '@/features/events/hooks';
import { useModalState, useConfirmDialog } from '@/hooks/common';
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
      <ProtectedLayout>
        <div className="text-center mt-10 text-red-400">{t('eventDetail.invalidId')}</div>
      </ProtectedLayout>
    );
  }

  if (isLoading) {
    return (
      <ProtectedLayout>
        <div className="text-center mt-10 text-teal-400">{t('common.loading')}</div>
      </ProtectedLayout>
    );
  }

  if (error) {
    return (
      <ProtectedLayout>
        <div className="text-center mt-10 text-red-400">
          {t('common.error')}: {error.message}
        </div>
      </ProtectedLayout>
    );
  }

  if (!event) {
    return (
      <ProtectedLayout>
        <div className="text-center mt-10">{t('eventDetail.notFound')}</div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
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
    </ProtectedLayout>
  );
}
