import { FaHandHoldingUsd, FaWallet, FaHandshake, FaPiggyBank } from 'react-icons/fa';
import type { Transaction } from '../types';
import type { PaymentType } from '../types';
import type { JSX } from 'react/jsx-runtime';
import type { Event } from '../../events/types';
import TransactionModal from './TransactionModal';
import { useState } from 'react';
import { formatAmount } from '../../../shared/utils/formatAmount';
import { formatDateLong } from '../../../shared/utils/formatDateLong';
import { useTranslation } from 'react-i18next';
import { useTransactionsStore } from '../store/useTransactionsStore';

const ICONS: Record<PaymentType, JSX.Element> = {
  contribution: <FaHandHoldingUsd className="text-blue-800 dark:text-blue-200" />,
  expense: <FaWallet className="text-red-800 dark:text-red-200" />,
  compensation: <FaHandshake className="text-green-800 dark:text-green-200" />,
};

// PARTICIPANT_PREFIX se traduce

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
  const { t } = useTranslation();
  const isPotExpense = useTransactionsStore(state => state.isPotExpense);

  // Ordenar por fecha descendente y agrupar
  const grouped = groupByDate([...transactions].sort((a, b) => b.date.localeCompare(a.date)));
  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="w-full max-w-2xl mb-8">
      {dates.length === 0 && (
        <div className="text-center text-teal-400 py-8">{t('transactionsList.noTransactions')}</div>
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
                <span className={`text-xl ${isPotExpense(trx) ? 'text-orange-800 dark:text-orange-200' : TEXT_COLOR_CLASSES[trx.paymentType]}`}>
                  {isPotExpense(trx) ? <FaPiggyBank className="text-orange-800 dark:text-orange-200" /> : ICONS[trx.paymentType]}
                </span>
                <div className="flex-1">
                  <div className="font-semibold text-teal-900 dark:text-teal-100">{trx.title}</div>
                  <div className="text-xs text-teal-500">
                    {t(`transactionsList.participantPrefix.${trx.paymentType}`)}{' '}
                    {isPotExpense(trx)
                      ? t('transactionsList.potLabel')
                      : (event.participants.find(p => p.id === trx.participantId)?.name || t('transactionsList.unknownParticipant'))
                    }
                  </div>
                </div>
                <div className={`font-bold text-lg tabular-nums ${isPotExpense(trx) ? 'text-orange-800 dark:text-orange-200' : TEXT_COLOR_CLASSES[trx.paymentType]}`}>{formatAmount(trx.amount)}</div>
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
