import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '@/api/events.api';
import { queryKeys } from './keys';
import type { UpdateEventInput } from '@/features/events/types';
import { useDeletingStore } from '@/shared/store/useDeletingStore';
import { useToast } from '@/shared/hooks/useToast';

/**
 * Query hook to fetch all events
 * @returns Query result with events list, loading state, and error
 */
export function useEvents() {
  return useQuery({
    queryKey: queryKeys.events.all,
    queryFn: eventsApi.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Query hook to fetch a single event by ID
 * @param id - Event ID
 * @returns Query result with event detail, loading state, and error
 */
export function useEvent(id?: string) {
  const isDeleting = useDeletingStore((state) => state.isDeleting);
  const eventId = id ?? '';

  return useQuery({
    queryKey: queryKeys.events.detail(eventId),
    queryFn: () => eventsApi.getById(eventId),
    enabled: !!eventId && !isDeleting, // Only fetch if ID is provided and not deleting
    retry: false, // Disable retry to prevent refetch after deletion
    staleTime: Infinity, // Never mark as stale to prevent automatic refetch
  });
}

/**
 * Mutation hook to create a new event
 * Automatically invalidates events list on success
 * @returns Mutation object with mutate function and status
 */
export function useCreateEvent() {
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: eventsApi.create,
    onSuccess: () => {
      success('events.create_success');
      // Invalidate events list to trigger refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
    },
    onError: () => {
      error('events.create_error');
    },
  });
}

/**
 * Mutation hook to update an existing event
 * Automatically invalidates events list and specific event detail on success
 * @returns Mutation object with mutate function and status
 */
export function useUpdateEvent() {
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEventInput }) => eventsApi.update(id, data),
    onSuccess: (_, { id }) => {
      success('events.update_success');
      // Invalidate both list and specific event detail
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.kpis(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.byEvent(id) });
    },
    onError: () => {
      error('events.update_error');
    },
  });
}

/**
 * Mutation hook to delete an event
 * Handles cascade delete by invalidating related transactions
 * Automatically removes event and transactions from cache on success
 * @returns Mutation object with mutate function and status
 */
export function useDeleteEvent() {
  const { success, error } = useToast();
  const queryClient = useQueryClient();
  const setDeleting = useDeletingStore((state) => state.setDeleting);

  return useMutation({
    mutationFn: (id: string) => eventsApi.delete(id),
    onMutate: async (deletedId) => {
      // Set deleting state to disable queries
      setDeleting(true);

      // Cancel any ongoing requests and remove queries from cache before deletion
      await queryClient.cancelQueries({ queryKey: ['events'] });
      await queryClient.cancelQueries({ queryKey: ['transactions'] });
      queryClient.removeQueries({ queryKey: ['events', deletedId], exact: false });
      queryClient.removeQueries({ queryKey: ['transactions', 'event', deletedId], exact: false });
    },
    onSuccess: async (_, deletedId) => {
      success('events.delete_success');
      // Note: Don't clear deleting state here to prevent re-enabling queries before unmount

      // Remove specific queries from cache to prevent stale data
      queryClient.removeQueries({ queryKey: queryKeys.events.detail(deletedId) });
      queryClient.removeQueries({ queryKey: queryKeys.events.kpis(deletedId) });
      queryClient.removeQueries({ queryKey: queryKeys.transactions.byEvent(deletedId) });

      // Invalidate lists to trigger refetch for unrelated queries
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
    },
    onError: () => {
      // Clear deleting state on error
      setDeleting(false);
      error('events.delete_error');
    },
  });
}
