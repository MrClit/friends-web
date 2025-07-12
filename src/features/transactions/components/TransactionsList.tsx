import { FaHandHoldingUsd, FaWallet, FaHandshake } from 'react-icons/fa';
import type { Transaction } from '../types';
import type { PaymentType } from '../types';
import type { JSX } from 'react/jsx-runtime';
import type { Event } from '../../events/types';
import TransactionModal from './TransactionModal';
import { useState } from 'react';
import { formatAmount } from '../../../shared/utils/formatAmount';
import { formatDateLong } from '../../../shared/utils/formatDateLong';

const ICONS: Record<PaymentType, JSX.Element> = {
  contribution: <FaHandHoldingUsd className="text-blue-800 dark:text-blue-200" />,
  expense: <FaWallet className="text-red-800 dark:text-red-200" />,
  compensation: <FaHandshake className="text-green-800 dark:text-green-200" />,
};

const PARTICIPANT_PREFIX: Record<PaymentType, string> = {
  contribution: 'Recibido de',
  expense: 'Pagado por',
  compensation: 'Pagado a',
};

const TEXT_COLOR_CLASSES: Record<PaymentType, string> = {
  contribution: 'text-blue-800 dark:text-blue-200',
  expense: 'text-red-800 dark:text-red-200',
  compensation: 'text-green-800 dark:text-green-200',
};

interface TransactionsListProps {
  transactions: Transaction[];
  event: Event
}

function groupByDate(expenses: Transaction[]) {
  return expenses.reduce((acc, exp) => {
    (acc[exp.date] = acc[exp.date] || []).push(exp);
    return acc;
  }, {} as Record<string, Transaction[]>);
}

export default function TransactionsList({ transactions, event }: TransactionsListProps) {
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Ordenar por fecha descendente y agrupar
  const grouped = groupByDate([...transactions].sort((a, b) => b.date.localeCompare(a.date)));
  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="w-full max-w-md mb-8">
      {dates.length === 0 && (
        <div className="text-center text-teal-400 py-8">No hay movimientos aún.</div>
      )}
      {dates.map(date => (
        <div key={date} className="mb-6">
          <div className="text-sm text-teal-500 font-semibold mb-1 border-b border-teal-100 dark:border-teal-800 pb-1">
            {formatDateLong(date)}
          </div>
          <ul className="flex flex-col gap-2">
            {grouped[date].map(trx => (
              <li
                key={trx.id}
                className="flex items-center gap-3 bg-white dark:bg-teal-950 rounded-lg px-4 py-3 shadow-sm cursor-pointer hover:bg-teal-50 dark:hover:bg-teal-900 transition-colors"
                onClick={() => {
                  setSelectedTransaction(trx);
                  setTransactionModalOpen(true);
                }}
              >
                <span className={`text-xl ${TEXT_COLOR_CLASSES[trx.paymentType]}`}>{ICONS[trx.paymentType]}</span>
                <div className="flex-1">
                  <div className="font-semibold text-teal-900 dark:text-teal-100">{trx.title}</div>
                  <div className="text-xs text-teal-500">
                    {PARTICIPANT_PREFIX[trx.paymentType]} {trx.payer}
                  </div>
                </div>
                <div className={`font-bold text-lg tabular-nums ${TEXT_COLOR_CLASSES[trx.paymentType]}`}>{formatAmount(trx.amount)}</div>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <TransactionModal 
        open={transactionModalOpen} 
        onClose={() => {
          setTransactionModalOpen(false);
          setSelectedTransaction(null);
        }} 
        event={event}
        transaction={selectedTransaction ?? undefined} />
    </div>
  );
}
