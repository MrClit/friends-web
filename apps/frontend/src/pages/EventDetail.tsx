import { MainLayout } from './MainLayout';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiError } from '@/api/client';
import { useEventDetail } from '@/features/events/hooks';
import { useConfirmDialog } from '@/hooks/common';
import { EventDetailHeader, EventKPIGrid, EventFormModal } from '@/features/events';
import { EventDetailSkeleton } from '@/features/events/components/EventDetailSkeleton';
import { useEventFormModalStore } from '@/shared/store/useEventFormModalStore';
import { useTransactionModalStore } from '@/shared/store/useTransactionModalStore';
import { TransactionModal } from '../features/transactions/components/TransactionModal';
import { TransactionsList } from '../features/transactions/components/TransactionsList';
import { ActionButton } from '@/shared/components/ActionButton';
import { ConfirmDialog, ErrorState } from '@/shared/components';
import { MdAdd } from 'react-icons/md';
import { useAuth } from '@/features/auth/useAuth';
import { useI18nNamespacesReady } from '@/shared/hooks/useI18nNamespacesReady';

const EVENT_DETAIL_NAMESPACES = ['eventDetail', 'events', 'transactions', 'common'] as const;

export function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation(EVENT_DETAIL_NAMESPACES);
  const isI18nReady = useI18nNamespacesReady(EVENT_DETAIL_NAMESPACES);
  const { user } = useAuth();
  const { event, kpis, isLoading, error, refetch, handleEditSubmit, handleDelete, handleBack } = useEventDetail(id);

  // UI state management
  const eventFormModalStore = useEventFormModalStore();
  const transactionModalStore = useTransactionModalStore();
  const deleteDialog = useConfirmDialog();

  // Validate id after all hooks
  if (!id) {
    return (
      <MainLayout>
        <div className="text-center mt-10 text-red-400">{t('invalidId')}</div>
      </MainLayout>
    );
  }

  if (isLoading || !isI18nReady) {
    return (
      <MainLayout>
        <EventDetailSkeleton />
      </MainLayout>
    );
  }

  if (error) {
    const isNotFoundOrNoAccess = error instanceof ApiError && error.status === 404;

    return (
      <MainLayout>
        <ErrorState
          message={isNotFoundOrNoAccess ? t('notFoundOrNoAccess', { ns: 'common' }) : undefined}
          onRetry={isNotFoundOrNoAccess ? undefined : () => void refetch()}
        />
      </MainLayout>
    );
  }

  if (!event) {
    return (
      <MainLayout>
        <div className="text-center mt-10">{t('notFound')}</div>
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
        currentUserId={user?.id}
        participants={event.participants}
        potBalance={kpis?.potBalance ?? 0}
        totalContributions={kpis?.totalContributions ?? 0}
        totalExpenses={kpis?.totalExpenses ?? 0}
        participantPending={kpis?.participantPending ?? {}}
      />

      <TransactionsList event={event} />
      <ActionButton
        onClick={() => transactionModalStore.openModal(event)}
        actionLabel={t('addTransaction')}
        actionIcon={<MdAdd size={22} />}
        className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2"
      />
      <EventFormModal />
      <TransactionModal />
      <ConfirmDialog
        open={deleteDialog.isOpen}
        title={t('deleteTitle')}
        message={t('deleteMessage')}
        confirmText={t('deleteConfirm')}
        cancelText={t('deleteCancel')}
        onConfirm={deleteDialog.handleConfirm}
        onCancel={deleteDialog.handleCancel}
      />
    </MainLayout>
  );
}
