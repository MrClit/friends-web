import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEvent, useUpdateEvent, useDeleteEvent } from '@/hooks/api/useEvents';
import { useEventKPIs } from '@/hooks/api/useEventKPIs';
import { EventDetailHeader, EventKPIGrid, EventFormModal } from '@/features/events';
import TransactionModal from '../features/transactions/components/TransactionModal';
import TransactionsList from '../features/transactions/components/TransactionsList';
import FloatingActionButton from '../shared/components/FloatingActionButton';
import ConfirmDialog from '../shared/components/ConfirmDialog';
import type { EventParticipant } from '../features/events/types';

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // React Query hooks
  const { data: event, isLoading, error } = useEvent(id!);
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const { kpis } = useEventKPIs(id!);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);

  const handleEditSubmit = ({
    id,
    title,
    participants,
  }: {
    id?: string;
    title: string;
    participants: EventParticipant[];
  }) => {
    if (id) {
      updateEvent.mutate(
        { id, data: { title, participants } },
        {
          onSuccess: () => setEditModalOpen(false),
        },
      );
    }
  };

  const handleDelete = () => {
    if (event) {
      deleteEvent.mutate(event.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          navigate('/');
        },
      });
    }
  };

  const handleBack = () => navigate('/');

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
        onEdit={() => setEditModalOpen(true)}
        onDelete={() => setDeleteDialogOpen(true)}
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
      <FloatingActionButton
        onClick={() => setTransactionModalOpen(true)}
        translationKey="eventDetail.addTransaction"
        icon={'+'}
      />
      <EventFormModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        event={event}
        onSubmit={handleEditSubmit}
      />
      <TransactionModal open={transactionModalOpen} onClose={() => setTransactionModalOpen(false)} event={event} />
      <ConfirmDialog
        open={deleteDialogOpen}
        title={t('eventDetail.deleteTitle')}
        message={t('eventDetail.deleteMessage')}
        confirmText={t('eventDetail.deleteConfirm')}
        cancelText={t('eventDetail.deleteCancel')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </div>
  );
}
