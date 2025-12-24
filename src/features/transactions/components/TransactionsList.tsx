import type { Transaction } from '../types';
import type { Event } from '../../events/types';
import TransactionModal from './TransactionModal';
import { useState } from 'react';
import { formatAmount } from '../../../shared/utils/formatAmount';
import { formatDateLong } from '../../../shared/utils/formatDateLong';
import { useTranslation } from 'react-i18next';
import { useTransactionsStore } from '../store/useTransactionsStore';
import { PAYMENT_TYPE_CONFIG, POT_CONFIG } from '../constants';

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
                <span className="text-xl">
                  {isPotExpense(trx) ? (
                    <POT_CONFIG.IconComponent className={POT_CONFIG.colorClass} />
                  ) : (
                    (() => {
                      const config = PAYMENT_TYPE_CONFIG[trx.paymentType];
                      const IconComponent = config.IconComponent;
                      return <IconComponent className={config.colorStrong} />;
                    })()
                  )}
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
                <div className={`font-bold text-lg tabular-nums ${isPotExpense(trx) ? POT_CONFIG.colorClass : PAYMENT_TYPE_CONFIG[trx.paymentType].colorStrong}`}>{formatAmount(trx.amount)}</div>
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
