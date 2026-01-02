import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEventsStore } from '../features/events/store/useEventsStore';
import { useTransactionsStore } from '../features/transactions/store/useTransactionsStore';
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

  const event = useEventsStore((state) => state.events.find((e) => e.id === id));
  const updateEvent = useEventsStore((state) => state.updateEvent);
  const removeEvent = useEventsStore((state) => state.removeEvent);

  const getTotalExpensesByEvent = useTransactionsStore((state) => state.getTotalExpensesByEvent);
  const getTotalContributionsByEvent = useTransactionsStore(
    (state) => state.getTotalContributionsByEvent,
  );
  const getPotBalanceByEvent = useTransactionsStore((state) => state.getPotBalanceByEvent);
  const getPendingToCompensateByEvent = useTransactionsStore(
    (state) => state.getPendingToCompensateByEvent,
  );

  const totalExpenses = event ? getTotalExpensesByEvent(event.id) : 0;
  const totalContributions = event ? getTotalContributionsByEvent(event.id) : 0;
  const potBalance = event ? getPotBalanceByEvent(event.id) : 0;
  const pendingToCompensate = event ? getPendingToCompensateByEvent(event.id) : 0;

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
      updateEvent(id, title, participants);
    }
    setEditModalOpen(false);
  };

  const handleBack = () => navigate('/');

  if (!event) return <div className="text-center mt-10">{t('eventDetail.notFound')}</div>;

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-teal-50 to-teal-100 dark:from-teal-900 dark:to-teal-950 p-4">
      <EventDetailHeader
        eventId={event.id}
        eventTitle={event.title}
        onBack={handleBack}
        onEdit={() => setEditModalOpen(true)}
        onDelete={() => setDeleteDialogOpen(true)}
      />

      <EventKPIGrid
        eventId={event.id}
        potBalance={potBalance}
        totalContributions={totalContributions}
        totalExpenses={totalExpenses}
        pendingToCompensate={pendingToCompensate}
      />

      {/* Lista de transacciones */}
      <TransactionsList event={event} />
      <FloatingActionButton
        onClick={() => setTransactionModalOpen(true)}
        label={t('eventDetail.addTransaction')}
        icon={'+'}
      />
      <EventFormModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        event={event}
        onSubmit={handleEditSubmit}
      />
      <TransactionModal
        open={transactionModalOpen}
        onClose={() => setTransactionModalOpen(false)}
        event={event}
      />
      <ConfirmDialog
        open={deleteDialogOpen}
        title={t('eventDetail.deleteTitle')}
        message={t('eventDetail.deleteMessage')}
        confirmText={t('eventDetail.deleteConfirm')}
        cancelText={t('eventDetail.deleteCancel')}
        onConfirm={() => {
          removeEvent(event.id);
          setDeleteDialogOpen(false);
          navigate('/');
        }}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </div>
  );
}
