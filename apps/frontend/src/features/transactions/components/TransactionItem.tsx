import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Transaction } from '../types';
import { useTransactionsStore } from '../store/useTransactionsStore';
import { PAYMENT_TYPE_CONFIG, POT_CONFIG } from '../constants';
import { formatAmount } from '../../../shared/utils/formatAmount';
import PaymentIcon from './PaymentIcon';

interface TransactionItemProps {
  transaction: Transaction;
  onClick: () => void;
  participantsMap: Map<string, string>;
}

/**
 * Individual transaction item component
 * Displays transaction info with icon, title, participant, and amount
 * Optimized with React.memo to prevent unnecessary re-renders
 */
function TransactionItem({ transaction, onClick, participantsMap }: TransactionItemProps) {
  const { t } = useTranslation();
  const isPotExpense = useTransactionsStore((state) => state.isPotExpense);

  const isPot = isPotExpense(transaction);

  // Determine icon to display
  const icon = isPot ? (
    <POT_CONFIG.IconComponent className={POT_CONFIG.colorClass} />
  ) : (
    <PaymentIcon type={transaction.paymentType} />
  );

  // Get participant name with fallback
  const participantName = isPot
    ? t('transactionsList.potLabel')
    : participantsMap.get(transaction.participantId) || t('transactionsList.unknownParticipant');

  // Determine amount color class
  const amountColorClass = isPot ? POT_CONFIG.colorClass : PAYMENT_TYPE_CONFIG[transaction.paymentType].colorStrong;

  return (
    <li
      className="flex items-center gap-3 bg-white dark:bg-teal-950 rounded-lg px-4 py-3 
        shadow-sm cursor-pointer hover:bg-teal-50 dark:hover:bg-teal-900 
        transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      role="button"
      tabIndex={0}
      aria-label={`${transaction.title}, ${formatAmount(transaction.amount)}`}
    >
      <span className="text-xl" aria-hidden="true">
        {icon}
      </span>
      <div className="flex-1">
        <div className="font-semibold text-teal-900 dark:text-teal-100">{transaction.title}</div>
        <div className="text-xs text-teal-500">
          {t(`transactionsList.participantPrefix.${transaction.paymentType}`)} {participantName}
        </div>
      </div>
      <div className={`font-bold text-lg tabular-nums ${amountColorClass}`}>{formatAmount(transaction.amount)}</div>
    </li>
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(TransactionItem);
