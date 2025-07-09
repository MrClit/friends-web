import { useEffect, useState } from "react";
import TransactionForm from './TransactionForm';
import type { PaymentType } from '../types';
import { useExpensesStore } from '../store/useExpensesStore';
import type { Event } from '../../events/types';

interface ExpenseModalProps {
  open: boolean;
  onClose: () => void;
  event: Event;
}

const TRANSACTION_TYPES: { key: PaymentType; label: string }[] = [
  { key: 'contribution', label: 'Contribución' },
  { key: 'expense', label: 'Gasto' },
  { key: 'compensation', label: 'Reembolso' },
];

export default function ExpenseModal({ open, onClose, event }: ExpenseModalProps) {
  const [type, setType] = useState<PaymentType>('contribution');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [from, setFrom] = useState('');
  const addExpense = useExpensesStore(state => state.addExpense);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setType('contribution');
      setTitle('');
      setAmount('');
      setDate(new Date().toISOString().slice(0, 10));
      setFrom('');
    }
  }, [open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !amount || !date || !from) return;
    addExpense({
      title,
      paymentType: type,
      amount: parseFloat(amount),
      payer: from,
      date,
      eventId: event.id,
    });
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-md min-h-[90vh] max-h-[95vh] bg-white dark:bg-teal-900 rounded-t-3xl p-6 shadow-lg animate-slideUp overflow-y-auto flex flex-col"
        onClick={e => e.stopPropagation()}
        style={{ borderRadius: '1.5rem 1.5rem 0 0' }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-teal-700 dark:text-teal-100">Añadir Gasto</h2>
          <button onClick={onClose} className="text-2xl text-teal-400 hover:text-teal-600">&times;</button>
        </div>
        {/* Selector de tipo de transacción */}
        <div className="flex mb-6">
          {TRANSACTION_TYPES.map(t => (
            <button
              key={t.key}
              className={`flex-1 py-2 rounded-t-lg font-semibold transition-colors duration-150 ${type === t.key ? 'bg-teal-500 text-white' : 'bg-teal-100 dark:bg-teal-800 text-teal-700 dark:text-teal-200'}`}
              onClick={() => setType(t.key)}
              type="button"
            >
              {t.label}
            </button>
          ))}
        </div>
        {/* Formulario para cualquier tipo */}
        <TransactionForm
          type={type}
          title={title}
          setTitle={setTitle}
          amount={amount}
          setAmount={setAmount}
          date={date}
          setDate={setDate}
          from={from}
          setFrom={setFrom}
          participants={event.participants}
          onSubmit={handleSubmit}
        />
      </div>
      <style>{`
        .animate-slideUp {
          animation: slideUp .3s cubic-bezier(.4,0,.2,1);
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
