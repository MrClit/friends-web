import { useMutation, useQuery, useQueryClient, useIsMutating } from '@tanstack/react-query';
import { shoppingApi } from '@/api/shopping.api';
import { queryKeys } from './keys';
import type { CreateShoppingItemDto, ShoppingItem } from '@/api/types';
import { useDeletingStore } from '@/shared/store/useDeletingStore';
import { useToast } from '@/shared/hooks/useToast';
import { SHOPPING_POLL_INTERVAL_MS, SHOPPING_STALE_TIME_MS } from '@/features/shopping/constants';

/**
 * Query hook for the shopping list of an event.
 *
 * This is the one query in the app whose data other people change while you are looking at it, so it
 * deliberately departs from the global defaults in lib/queryClient.ts:
 * - polls on an interval, suspended while any shopping mutation is in flight so a poll cannot land on
 *   top of an optimistic value;
 * - refetches on focus and on reconnect, which the global defaults disable for data only the local
 *   user edits;
 * - keeps a staleTime below the interval, because refetchOnWindowFocus only refetches a stale query;
 * - never retries, since a 15s interval would turn a backend outage into a request storm.
 *
 * @param eventId - Event ID
 * @returns Query result with the list, loading state and error
 */
export function useShoppingItems(eventId: string) {
  const isDeleting = useDeletingStore((state) => state.isDeleting);
  const isMutating = useIsMutating({ mutationKey: queryKeys.shoppingItems.byEvent(eventId) }) > 0;

  return useQuery({
    queryKey: queryKeys.shoppingItems.byEvent(eventId),
    queryFn: () => shoppingApi.getByEvent(eventId),
    enabled: !!eventId && !isDeleting,
    staleTime: SHOPPING_STALE_TIME_MS,
    refetchInterval: isMutating ? false : SHOPPING_POLL_INTERVAL_MS,
    // Explicit although it is the default: this is what stops a hidden tab from polling.
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: false,
  });
}

/**
 * Mutation hook to add an item to the list.
 * No success toast: the row appearing is the feedback, and one toast per item while chaining several
 * would be unbearable.
 * @param eventId - Event ID
 * @returns Mutation object with mutate function and status
 */
export function useCreateShoppingItem(eventId: string) {
  const { error } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: queryKeys.shoppingItems.byEvent(eventId),
    mutationFn: (data: CreateShoppingItemDto) => shoppingApi.create(eventId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.shoppingItems.byEvent(eventId) });
    },
    onError: () => {
      error('create_error', undefined, { ns: 'shopping' });
    },
  });
}

/**
 * Mutation hook to rename an item.
 * @param eventId - Event ID the item belongs to
 * @returns Mutation object with mutate function and status
 */
export function useRenameShoppingItem(eventId: string) {
  const { error } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: queryKeys.shoppingItems.byEvent(eventId),
    mutationFn: ({ id, name }: { id: string; name: string }) => shoppingApi.update(id, { name }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.shoppingItems.byEvent(eventId) });
    },
    onError: () => {
      error('rename_error', undefined, { ns: 'shopping' });
    },
  });
}

/**
 * Mutation hook to mark an item as purchased or back as pending.
 *
 * The only optimistic mutation in the app, and deliberately so: this is tapped dozens of times in a
 * row while walking an aisle on a flaky connection, and a round-trip per tap makes the checkbox feel
 * broken. Everything else here follows the repo's invalidate-and-refetch model.
 *
 * @param eventId - Event ID the item belongs to
 * @param currentUserId - Id used for the optimistic attribution; the server owns the real one
 * @returns Mutation object with mutate function and status
 */
export function useToggleShoppingItemPurchased(eventId: string, currentUserId?: string) {
  const { error } = useToast();
  const queryClient = useQueryClient();
  const queryKey = queryKeys.shoppingItems.byEvent(eventId);

  return useMutation({
    mutationKey: queryKey,
    mutationFn: ({ id, purchased }: { id: string; purchased: boolean }) => shoppingApi.update(id, { purchased }),
    onMutate: async ({ id, purchased }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousItems = queryClient.getQueryData<ShoppingItem[]>(queryKey);

      queryClient.setQueryData<ShoppingItem[]>(queryKey, (items) =>
        items?.map((item) =>
          item.id === id
            ? {
                ...item,
                purchasedAt: purchased ? new Date().toISOString() : null,
                purchasedBy: purchased ? (currentUserId ?? null) : null,
              }
            : item,
        ),
      );

      return { previousItems };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(queryKey, context.previousItems);
      }
      error('toggle_error', undefined, { ns: 'shopping' });
    },
    onSettled: () => {
      // Only the last mutation still in flight reconciles: otherwise the invalidation of an earlier
      // toggle would refetch server state on top of a later toggle's optimistic value.
      if (queryClient.isMutating({ mutationKey: queryKey }) === 1) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });
}

/**
 * Mutation hook to delete an item. Keeps its success toast: it is destructive, confirmed, and the row
 * it removes may well be off-screen.
 * @param eventId - Event ID the item belongs to
 * @returns Mutation object with mutate function and status
 */
export function useDeleteShoppingItem(eventId: string) {
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: queryKeys.shoppingItems.byEvent(eventId),
    mutationFn: (id: string) => shoppingApi.delete(id),
    onSuccess: () => {
      success('delete_success', undefined, undefined, { ns: 'shopping' });
      void queryClient.invalidateQueries({ queryKey: queryKeys.shoppingItems.byEvent(eventId) });
    },
    onError: () => {
      error('delete_error', undefined, { ns: 'shopping' });
    },
  });
}
