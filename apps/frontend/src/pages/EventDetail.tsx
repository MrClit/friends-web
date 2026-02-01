import MainLayout from './MainLayout';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEventDetail } from '@/features/events/hooks';
import { useModalState, useConfirmDialog } from '@/hooks/common';
import { EventDetailHeader, EventKPIGrid, EventFormModal } from '@/features/events';
import useEventFormModalStore from '@/shared/store/useEventFormModalStore';
import TransactionModal from '../features/transactions/components/TransactionModal';
import TransactionsList from '../features/transactions/components/TransactionsList';
import FloatingActionButton from '../shared/components/FloatingActionButton';
import { ConfirmDialog } from '@/shared/components';

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { event, kpis, isLoading, error, handleEditSubmit, handleDelete, handleBack } = useEventDetail(id);

  // UI state management
  const eventFormModalStore = useEventFormModalStore();
  const transactionModal = useModalState(); // TODO: Replace with Zustand store
  const deleteDialog = useConfirmDialog();

  // Validate id after all hooks
  if (!id) {
    return (
      <MainLayout>
        <div className="text-center mt-10 text-red-400">{t('eventDetail.invalidId')}</div>
      </MainLayout>
    );
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="text-center mt-10 text-teal-400">{t('common.loading')}</div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="text-center mt-10 text-red-400">
          {t('common.error')}: {error.message}
        </div>
      </MainLayout>
    );
  }

  if (!event) {
    return (
      <MainLayout>
        <div className="text-center mt-10">{t('eventDetail.notFound')}</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <EventDetailHeader
        eventId={event.id}
        eventTitle={event.title}
        onBack={handleBack}
        onEdit={() =>
          eventFormModalStore.openModal({
            event,
            onSubmit: (data) => handleEditSubmit(data, eventFormModalStore.closeModal),
          })
        }
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
      <EventFormModal />
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
    </MainLayout>
  );
}
