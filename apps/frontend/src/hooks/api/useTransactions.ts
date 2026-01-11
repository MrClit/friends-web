import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { transactionsApi } from '@/api/transactions.api';
import { queryKeys } from './keys';
import type { CreateTransactionDto, UpdateTransactionDto } from '@/api/types';
import { useDeletingStore } from '@/shared/store/useDeletingStore';

/**
 * Query hook to fetch all transactions for a specific event
 * @param eventId - Event ID
 * @returns Query result with transactions list, loading state, and error
 */
export function useTransactionsByEvent(eventId: string) {
  const isDeleting = useDeletingStore((state) => state.isDeleting);

  return useQuery({
    queryKey: queryKeys.transactions.byEvent(eventId),
    queryFn: () => transactionsApi.getByEvent(eventId),
    enabled: !!eventId && !isDeleting, // Only fetch if eventId is provided and not deleting
    retry: false, // Disable retry to prevent refetch after deletion
    staleTime: Infinity, // Never mark as stale to prevent automatic refetch
  });
}

/**
 * Infinite query hook for paginated transactions by unique dates
 * Special pagination: groups by unique dates, not item count
 * @param eventId - Event ID
 * @param numberOfDates - Number of unique dates to fetch per page (default: 3)
 * @returns Infinite query result with pages, fetchNextPage, hasNextPage, etc.
 */
export function useTransactionsPaginated(eventId: string, numberOfDates = 3) {
  const isDeleting = useDeletingStore((state) => state.isDeleting);

  return useInfiniteQuery({
    queryKey: queryKeys.transactions.paginated(eventId, { numberOfDates, offset: 0 }),
    queryFn: ({ pageParam = 0 }) => transactionsApi.getPaginated(eventId, numberOfDates, pageParam),
    getNextPageParam: (lastPage, allPages) => {
      // Return undefined if no more pages (stops infinite query)
      if (!lastPage.hasMore) return undefined;
      // Calculate next offset based on loaded pages
      return allPages.length * numberOfDates;
    },
    initialPageParam: 0,
    enabled: !!eventId && !isDeleting, // Only fetch if eventId is provided and not deleting
    retry: false, // Disable retry to prevent refetch after deletion
    staleTime: Infinity, // Never mark as stale to prevent automatic refetch
  });
}

/**
 * Query hook to fetch a single transaction by ID
 * @param id - Transaction ID
 * @returns Query result with transaction detail, loading state, and error
 */
export function useTransaction(id: string) {
  return useQuery({
    queryKey: queryKeys.transactions.detail(id),
    queryFn: () => transactionsApi.getById(id),
    enabled: !!id, // Only fetch if ID is provided
  });
}

/**
 * Mutation hook to create a new transaction
 * Automatically invalidates transactions and event detail on success
 * @param eventId - Event ID for the transaction
 * @returns Mutation object with mutate function and status
 */
export function useCreateTransaction(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTransactionDto) => transactionsApi.create(eventId, data),
    onSuccess: () => {
      // Invalidate transactions for this event
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions.byEvent(eventId),
      });
      // Invalidate event detail (KPIs might have changed)
      queryClient.invalidateQueries({
        queryKey: queryKeys.events.detail(eventId),
      });
    },
  });
}

/**
 * Mutation hook to update an existing transaction
 * Automatically invalidates related queries on success
 * @returns Mutation object with mutate function and status
 */
export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransactionDto }) => transactionsApi.update(id, data),
    onSuccess: (transaction) => {
      // Invalidate transactions for the event
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions.byEvent(transaction.eventId),
      });
      // Invalidate specific transaction detail
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions.detail(transaction.id),
      });
      // Invalidate event detail (KPIs might have changed)
      queryClient.invalidateQueries({
        queryKey: queryKeys.events.detail(transaction.eventId),
      });
    },
  });
}

/**
 * Mutation hook to delete a transaction
 * Automatically invalidates all transaction queries on success
 * @returns Mutation object with mutate function and status
 */
export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => transactionsApi.delete(id),
    onSuccess: () => {
      // Invalidate all transaction queries
      // This ensures all related data is refreshed
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
    },
  });
}
