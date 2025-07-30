import { useParams } from 'react-router-dom';
import { useEventsStore } from '../features/events/store/useEventsStore';
import { IconButton } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import KPIBox from '../features/events/components/KPIBox';
import { useState } from 'react';
import EventContextMenu from '../features/events/components/EventContextMenu';
import EventFormModal from '../features/events/components/EventFormModal';
import ConfirmDialog from '../shared/components/ConfirmDialog';
import TransactionModal from '../features/transactions/components/TransactionModal';
import TransactionsList from '../features/transactions/components/TransactionsList';
import { useTransactionsStore } from '../features/transactions/store/useTransactionsStore';
import FloatingActionButton from '../shared/components/FloatingActionButton';
import type { EventParticipant } from '../features/events/types';
import { useTranslation } from 'react-i18next';

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const event = useEventsStore(state => state.events.find(e => e.id === id));
  const updateEvent = useEventsStore(state => state.updateEvent);
  const removeEvent = useEventsStore(state => state.removeEvent);
  
  const getTotalExpensesByEvent = useTransactionsStore(state => state.getTotalExpensesByEvent);
  const getTotalContributionsByEvent = useTransactionsStore(state => state.getTotalContributionsByEvent);
  const getPotBalanceByEvent = useTransactionsStore(state => state.getPotBalanceByEvent);
  const getPendingToCompensateByEvent = useTransactionsStore(state => state.getPendingToCompensateByEvent);
  
  // Obtén todas las transacciones del store y filtra fuera del selector para evitar bucles
  const allTransactions = useTransactionsStore(state => state.transactions);
  const transactions = event ? allTransactions.filter(e => e.eventId === event.id) : [];
  
  const totalExpenses = event ? getTotalExpensesByEvent(event.id) : 0;
  const totalContributions = event ? getTotalContributionsByEvent(event.id) : 0;
  const potBalance = event ? getPotBalanceByEvent(event.id) : 0;
  const pendingToCompensate = event ? getPendingToCompensateByEvent(event.id) : 0;
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  
  const open = Boolean(anchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditSubmit = ({ id, title, participants }: { id?: string; title: string; participants: EventParticipant[] }) => {
    if (id) {
      updateEvent(id, title, participants);
    }
    setEditModalOpen(false);
  };

  if (!event) return <div className="text-center mt-10">{t('eventDetail.notFound')}</div>;

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-teal-50 to-teal-100 dark:from-teal-900 dark:to-teal-950 p-4">
      <div className="flex items-center justify-between w-full max-w-2xl mt-8 mb-4 gap-2">
        <IconButton onClick={() => navigate('/') }>
          <ArrowBackIcon className="text-teal-900 dark:text-teal-100" />
        </IconButton>
        <h1 className="text-2xl md:text-3xl font-bold text-center flex-1 truncate text-teal-900 dark:text-teal-100">{event.title}</h1>
        <IconButton onClick={handleMenuClick}>
          <MoreVertIcon className="text-teal-900 dark:text-teal-100" />
        </IconButton>
        <EventContextMenu
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          onEdit={() => setEditModalOpen(true)}
          onDelete={() => setDeleteDialogOpen(true)}
        />
      </div>
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-2xl mb-8">
        <KPIBox
          label={t('eventDetail.kpi.pot')}
          value={potBalance}
          colorClass="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
          onClick={() => navigate(`/event/${event.id}/kpi/pot`)}
          style={{ cursor: 'pointer' }}
        />
        <KPIBox
          label={t('eventDetail.kpi.contributions')}
          value={totalContributions}
          colorClass="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
          onClick={() => navigate(`/event/${event.id}/kpi/contributions`)}
          style={{ cursor: 'pointer' }}
        />
        <KPIBox
          label={t('eventDetail.kpi.expenses')}
          value={totalExpenses}
          colorClass="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
          onClick={() => navigate(`/event/${event.id}/kpi/expenses`)}
          style={{ cursor: 'pointer' }}
        />
        <KPIBox
          label={t('eventDetail.kpi.pending')}
          value={pendingToCompensate}
          colorClass="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
          onClick={() => navigate(`/event/${event.id}/kpi/pending`)}
          style={{ cursor: 'pointer' }}
        />
      </div>
      {/* Lista de transacciones */}
      <TransactionsList transactions={transactions} event={event}/>
      <FloatingActionButton
        onClick={() => setTransactionModalOpen(true)}
        label={t('eventDetail.addTransaction')}
        icon={"+"}
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
