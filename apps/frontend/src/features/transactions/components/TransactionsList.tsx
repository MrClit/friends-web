import type { Transaction } from '../types';
import type { Event } from '../../events/types';
import TransactionModal from './TransactionModal';
import TransactionItem from './TransactionItem';
import { useState, useMemo, useCallback } from 'react';
import { formatDateLong } from '../../../shared/utils/formatDateLong';
import { useTranslation } from 'react-i18next';
import { useTransactionsStore } from '../store/useTransactionsStore';
import { useInfiniteScroll } from '../../../shared/hooks';

interface TransactionsListProps {
  event: Event;
}

function groupByDate(transactions: Transaction[]) {
  return transactions.reduce(
    (acc, tx) => {
      (acc[tx.date] = acc[tx.date] || []).push(tx);
      return acc;
    },
    {} as Record<string, Transaction[]>,
  );
}

export default function TransactionsList({ event }: TransactionsListProps) {
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [loadedDates, setLoadedDates] = useState(10); // Start with 10 days
  const { t } = useTranslation();

  // Get paginated transactions from store
  const getTransactionsPaginated = useTransactionsStore(
    (state) => state.getTransactionsByEventPaginated,
  );

  // Get paginated data with useMemo to avoid recalculations
  const { transactions, hasMore } = useMemo(
    () => getTransactionsPaginated(event.id, loadedDates, 0),
    [event.id, loadedDates, getTransactionsPaginated],
  );

  // Create participants map for O(1) lookup
  const participantsMap = useMemo(
    () => new Map(event.participants.map((p) => [p.id, p.name])),
    [event.participants],
  );

  // Infinite scroll handler
  const loadMore = useCallback(() => {
    if (hasMore) {
      setLoadedDates((prev) => prev + 5); // Load 5 more days
    }
  }, [hasMore]);

  const { observerRef, isLoading } = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    threshold: 0.1,
  });

  // Group transactions by date
  const grouped = useMemo(() => groupByDate(transactions), [transactions]);
  const dates = useMemo(() => Object.keys(grouped).sort((a, b) => b.localeCompare(a)), [grouped]);

  // Handler for clicking on a transaction
  const handleTransactionClick = useCallback((transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setTransactionModalOpen(true);
  }, []);

  // Handler for closing modal
  const handleCloseModal = useCallback(() => {
    setTransactionModalOpen(false);
    setSelectedTransaction(null);
  }, []);

  return (
    <div className="w-full max-w-2xl mb-8">
      {dates.length === 0 && (
        <div className="text-center text-teal-400 py-8">{t('transactionsList.noTransactions')}</div>
      )}
      {dates.map((date) => (
        <div key={date} className="mb-6">
          <div className="text-sm text-teal-500 font-semibold mb-1 border-b border-teal-100 dark:border-teal-800 pb-1">
            {formatDateLong(date)}
          </div>
          <ul className="flex flex-col gap-2">
            {grouped[date].map((trx) => (
              <TransactionItem
                key={trx.id}
                transaction={trx}
                participantsMap={participantsMap}
                onClick={() => handleTransactionClick(trx)}
              />
            ))}
          </ul>
        </div>
      ))}

      {/* Infinite scroll trigger */}
      {hasMore && (
        <div ref={observerRef} className="py-4 text-center">
          {isLoading ? (
            <div className="flex justify-center items-center gap-2 text-teal-500">
              <div
                className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-500"
                aria-hidden="true"
              ></div>
              <span>{t('transactionsList.loadingMore')}</span>
            </div>
          ) : (
            <button
              onClick={loadMore}
              className="text-teal-600 dark:text-teal-400 hover:underline text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 rounded px-2 py-1"
              aria-label={t('transactionsList.loadMore')}
            >
              {t('transactionsList.loadMore')}
            </button>
          )}
        </div>
      )}

      <TransactionModal
        open={transactionModalOpen}
        onClose={handleCloseModal}
        event={event}
        transaction={selectedTransaction ?? undefined}
      />
    </div>
  );
}
