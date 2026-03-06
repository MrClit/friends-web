import type { Transaction } from '../types';
import type { Event } from '../../events/types';
import { TransactionModal } from './TransactionModal';
import { TransactionItem } from './TransactionItem';
import { useMemo, useCallback } from 'react';
import { formatDateLong } from '@/shared/utils/format';
import { useTranslation } from 'react-i18next';
import { ApiError } from '@/api/client';
import { useTransactionsPaginated } from '@/hooks/api/useTransactions';
import { useInfiniteScroll } from '@/hooks/common';
import { useTransactionModalStore } from '@/shared/store/useTransactionModalStore';
import { ErrorState } from '@/shared/components';
import { getParticipantName } from '@/features/events/utils/participants';

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

export function TransactionsList({ event }: TransactionsListProps) {
  const transactionModalStore = useTransactionModalStore();
  const { t } = useTranslation();

  // Use React Query infinite query for pagination
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error, refetch } = useTransactionsPaginated(
    event.id,
    3,
  );

  // Flatten all pages into single array
  const allTransactions = useMemo(() => data?.pages.flatMap((page) => page.transactions) ?? [], [data]);

  // Create participants map for O(1) lookup
  const participantsMap = useMemo(
    () => new Map(event.participants.map((participant) => [participant.id, getParticipantName(participant, t)])),
    [event.participants, t],
  );

  // Infinite scroll handler
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const { observerRef } = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore: hasNextPage ?? false,
    threshold: 0.1,
  });

  // Group transactions by date
  const grouped = useMemo(() => groupByDate(allTransactions), [allTransactions]);
  const dates = useMemo(() => Object.keys(grouped).sort((a, b) => b.localeCompare(a)), [grouped]);

  // Handler for clicking on a transaction
  const handleTransactionClick = useCallback(
    (transaction: Transaction) => {
      transactionModalStore.openModal(event, transaction);
    },
    [transactionModalStore, event],
  );

  if (isLoading) {
    return <div className="w-full max-w-2xl mb-8 text-center text-teal-400 py-8">{t('common.loading')}</div>;
  }

  if (error) {
    const isNotFoundOrNoAccess = error instanceof ApiError && error.status === 404;

    return (
      <ErrorState
        message={isNotFoundOrNoAccess ? t('common.notFoundOrNoAccess') : undefined}
        onRetry={isNotFoundOrNoAccess ? undefined : () => void refetch()}
      />
    );
  }

  return (
    <section className="space-y-6 pb-24">
      {dates.length === 0 && (
        <div className="text-center text-teal-400 py-8">{t('transactionsList.noTransactions')}</div>
      )}
      {dates.map((date) => (
        <div key={date} className="mb-6">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 px-1 uppercase tracking-wide">
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
      {hasNextPage && (
        <div ref={observerRef} className="py-4 text-center">
          {isFetchingNextPage ? (
            <div className="flex justify-center items-center gap-2 text-teal-500">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-500" aria-hidden="true"></div>
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

      <TransactionModal />
    </section>
  );
}
