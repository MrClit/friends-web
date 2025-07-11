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
import { useTransactionsStore } from '../features/transactions/store/useExpensesStore';

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const event = useEventsStore(state => state.events.find(e => e.id === id));
  const updateEvent = useEventsStore(state => state.updateEvent);
  const removeEvent = useEventsStore(state => state.removeEvent);
  
  const getExpensesByEvent = useTransactionsStore(state => state.getExpensesByEvent);
  const getTotalExpensesByEvent = useTransactionsStore(state => state.getTotalExpensesByEvent);
  const getTotalContributionsByEvent = useTransactionsStore(state => state.getTotalContributionsByEvent);
  const getTotalCompensationsByEvent = useTransactionsStore(state => state.getTotalCompensationsByEvent);
  const expenses = event ? getExpensesByEvent(event.id) : [];
  
  const totalExpenses = event ? getTotalExpensesByEvent(event.id) : 0;
  const totalContributions = event ? getTotalContributionsByEvent(event.id) : 0;
  const totalCompensations = event ? getTotalCompensationsByEvent(event.id) : 0;
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  
  const open = Boolean(anchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditSubmit = ({ id, title, participants }: { id?: string; title: string; participants: string[] }) => {
    if (id) {
      updateEvent(id, title, participants.map(name => ({ name })));
    }
    setEditModalOpen(false);
  };

  // KPIs calculation
  const potBalance = totalContributions - totalCompensations;
  const pendingToPay = totalExpenses - totalCompensations;

  if (!event) return <div className="text-center mt-10">Evento no encontrado</div>;

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-teal-50 to-teal-100 dark:from-teal-900 dark:to-teal-950 p-4">
      <div className="flex items-center justify-between w-full max-w-2xl mt-8 mb-4 gap-2">
        <IconButton onClick={() => navigate('/') }>
          <ArrowBackIcon />
        </IconButton>
        <h1 className="text-3xl font-bold text-center flex-1 truncate">{event.title}</h1>
        <IconButton onClick={handleMenuClick}>
          <MoreVertIcon />
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
      <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-8">
        <KPIBox label="Saldo del Bote" value={potBalance} colorClass="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" />
        <KPIBox label="Contribución Total" value={totalContributions} colorClass="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" />
        <KPIBox label="Gastos Totales" value={totalExpenses} colorClass="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" />
        <KPIBox label="Pendiente de Pagar" value={pendingToPay} colorClass="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" />
      </div>
      
      {/* Lista de transacciones */}
      <TransactionsList transactions={expenses} />
      
      <button
        type="button"
        className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-6 py-3 rounded-full bg-teal-500 hover:bg-teal-600 text-white font-bold shadow-lg text-lg transition-all focus:outline-none focus:ring-2 focus:ring-teal-300 z-50"
        onClick={() => setExpenseModalOpen(true)}
      >
        <span className="text-2xl leading-none">+</span>
        Añadir Transacción
      </button>
      <EventFormModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        event={event}
        onSubmit={handleEditSubmit}
      />
      <TransactionModal open={expenseModalOpen} onClose={() => setExpenseModalOpen(false)} event={event} />
      <ConfirmDialog
        open={deleteDialogOpen}
        title="¿Borrar evento?"
        message="Esta acción no se puede deshacer. ¿Seguro que quieres borrar este evento?"
        confirmText="Borrar"
        cancelText="Cancelar"
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
