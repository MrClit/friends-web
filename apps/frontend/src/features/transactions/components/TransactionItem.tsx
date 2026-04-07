import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Transaction } from '../types';
import { PAYMENT_TYPE_CONFIG, POT_CONFIG } from '../constants';
import { formatAmount } from '@/shared/utils/format';
import { PaymentIcon } from './PaymentIcon';
import { isPotExpense } from '../utils';
import { cn } from '@/shared/utils/cn';

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
function TransactionItemBase({ transaction, onClick, participantsMap }: TransactionItemProps) {
  const { t } = useTranslation('transactions');

  const isPot = isPotExpense(transaction);

  // Select color palette based on transaction type or pot
  const colors = isPot ? POT_CONFIG.colors : PAYMENT_TYPE_CONFIG[transaction.paymentType].colors;

  // Get participant name with fallback
  const participantName = isPot
    ? t('transactionsList.potLabel')
    : participantsMap.get(transaction.participantId) || t('transactionsList.unknownParticipant');

  // Determine icon to display
  const icon = isPot ? (
    <POT_CONFIG.IconComponent className="text-xl" />
  ) : (
    <PaymentIcon type={transaction.paymentType} />
  );

  return (
    <li
      className={cn(
        'flex items-center justify-between gap-3',
        'bg-slate-50 dark:bg-emerald-950 p-3 rounded-xl',
        'shadow-sm border border-slate-100 dark:border-slate-700/50',
        'hover:shadow-md transition-all cursor-pointer',
        colors.hover.light,
        colors.hover.dark,
        'focus:outline-none focus:ring-2 focus:ring-teal-500',
      )}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      role="button"
      tabIndex={0}
      aria-label={`${transaction.title}, ${formatAmount(transaction.amount)}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
            colors.bg.light,
            colors.bg.dark,
            colors.text.light,
            colors.text.dark,
          )}
          aria-hidden="true"
        >
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">{transaction.title}</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t(`transactionsList.participantPrefix.${transaction.paymentType}`)} {participantName}
          </p>
        </div>
      </div>
      <div className={cn('font-bold text-base tabular-nums', colors.amount.light, colors.amount.dark)}>
        {formatAmount(transaction.amount)}
      </div>
    </li>
  );
}

// Memoize to prevent unnecessary re-renders
export const TransactionItem = memo(TransactionItemBase);
