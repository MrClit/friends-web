import { useEffect, useState } from 'react';
import TransactionForm from './TransactionForm';
import type { PaymentType, Transaction } from '../types';
import type { Event } from '../../events/types';
import TransactionTypeSelector from './TransactionTypeSelector';
import ConfirmDialog from '../../../shared/components/ConfirmDialog';
import { useTranslation } from 'react-i18next';
import { useCreateTransaction, useUpdateTransaction, useDeleteTransaction } from '../../../hooks/api/useTransactions';

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  event: Event;
  transaction?: Transaction; // Optional for editing existing transactions
}

export default function TransactionModal({ open, onClose, event, transaction }: TransactionModalProps) {
  const [type, setType] = useState<PaymentType>('contribution');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [participantId, setParticipantId] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { t } = useTranslation();

  // React Query mutations
  const createTransaction = useCreateTransaction(event.id);
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  useEffect(() => {
    if (transaction) {
      setType(transaction.paymentType);
      setTitle(transaction.title);
      setAmount(transaction.amount.toString());
      setDate(transaction.date.slice(0, 10));
      setParticipantId(transaction.participantId || '');
    } else {
      setType('contribution');
      setTitle('');
      setAmount('');
      setDate(new Date().toISOString().slice(0, 10));
      setParticipantId('');
    }
  }, [transaction, open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !amount || !date || !participantId) return;
    if (transaction) {
      // Update existing transaction
      updateTransaction.mutate(
        {
          id: transaction.id,
          data: {
            title,
            paymentType: type,
            amount: parseFloat(amount),
            participantId: participantId,
            date,
          },
        },
        {
          onSuccess: () => {
            onClose();
          },
        },
      );
      return;
    }
    // Create new transaction
    createTransaction.mutate(
      {
        title,
        paymentType: type,
        amount: parseFloat(amount),
        participantId: participantId,
        date,
      },
      {
        onSuccess: () => {
          onClose();
        },
      },
    );
  }

  function handleDelete() {
    setConfirmOpen(true);
  }

  function handleConfirmDelete() {
    if (transaction) {
      deleteTransaction.mutate(transaction.id, {
        onSuccess: () => {
          setConfirmOpen(false);
          onClose();
        },
      });
    }
  }

  function handleCancelDelete() {
    setConfirmOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-md min-h-[50vh] max-h-[95vh] bg-white dark:bg-teal-900 rounded-t-3xl p-6 shadow-lg animate-slideUp overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ borderRadius: '1.5rem 1.5rem 0 0' }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-teal-700 dark:text-teal-100">
            {transaction ? t('transactionModal.editTitle') : t('transactionModal.addTitle')}
          </h2>
          <button onClick={onClose} className="text-2xl text-teal-400 hover:text-teal-600">
            &times;
          </button>
        </div>
        <div className="flex mb-6 justify-center">
          <TransactionTypeSelector value={type} onChange={setType} />
        </div>
        <TransactionForm
          type={type}
          title={title}
          setTitle={setTitle}
          amount={amount}
          setAmount={setAmount}
          date={date}
          setDate={setDate}
          from={participantId}
          setParticipantId={setParticipantId}
          participants={event.participants}
          onSubmit={handleSubmit}
        />
        {transaction && (
          <>
            <button
              onClick={handleDelete}
              className="mt-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white font-bold text-lg transition-all focus:outline-none focus:ring-2 focus:ring-red-300"
            >
              {t('transactionModal.delete')}
            </button>
            <ConfirmDialog
              open={confirmOpen}
              title={t('transactionModal.deleteTitle')}
              message={t('transactionModal.deleteMessage')}
              confirmText={t('transactionModal.delete')}
              cancelText={t('transactionModal.cancel')}
              onConfirm={handleConfirmDelete}
              onCancel={handleCancelDelete}
            />
          </>
        )}
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
