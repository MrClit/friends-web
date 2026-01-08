import { useNavigate } from 'react-router-dom';
import { useEvent, useUpdateEvent, useDeleteEvent } from '@/hooks/api/useEvents';
import { useEventKPIs } from '@/hooks/api/useEventKPIs';
import type { EventParticipant } from '@/features/events/types';

/**
 * Custom hook for managing EventDetail page business logic
 * Handles data fetching, mutations, and navigation
 * Does NOT manage UI state (modals, dialogs) - that's handled by the page component
 */
export function useEventDetail(id: string | undefined) {
  const navigate = useNavigate();

  // React Query hooks for data fetching and mutations
  const { data: event, isLoading, error } = useEvent(id ?? '');
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const { kpis } = useEventKPIs(id ?? '');

  /**
   * Handles event update submission
   * Note: Caller is responsible for closing the modal on success
   */
  const handleEditSubmit = (
    {
      id,
      title,
      participants,
    }: {
      id?: string;
      title: string;
      participants: EventParticipant[];
    },
    onSuccess?: () => void,
  ) => {
    if (id) {
      updateEvent.mutate(
        { id, data: { title, participants } },
        {
          onSuccess: () => {
            // Let the caller handle UI state (closing modal)
            onSuccess?.();
          },
        },
      );
    }
  };

  /**
   * Handles event deletion
   * Navigates to home on success
   */
  const handleDelete = () => {
    if (event) {
      deleteEvent.mutate(event.id, {
        onSuccess: () => {
          navigate('/');
        },
      });
    }
  };

  /**
   * Navigates back to home
   */
  const handleBack = () => navigate('/');

  return {
    // Data
    event,
    kpis,
    isLoading,
    error,
    // Handlers
    handleEditSubmit,
    handleDelete,
    handleBack,
  };
}
