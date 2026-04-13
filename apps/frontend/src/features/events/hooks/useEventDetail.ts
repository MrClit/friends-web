import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvent, useUpdateEvent, useDeleteEvent } from '@/hooks/api/useEvents';
import { useEventKPIs } from '@/hooks/api/useEventKPIs';
import type { EventFormData } from '@/features/events/types';
import { useDeletingStore } from '@/shared/store/useDeletingStore';

/**
 * Custom hook for managing EventDetail page business logic
 * Handles data fetching, mutations, and navigation
 * Does NOT manage UI state (modals, dialogs) - that's handled by the page component
 */
export function useEventDetail(id: string | undefined) {
  const navigate = useNavigate();
  const setDeleting = useDeletingStore((state) => state.setDeleting);

  // React Query hooks for data fetching and mutations
  const { data: event, isLoading, error, refetch } = useEvent(id);
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const { data: kpis } = useEventKPIs(id);

  useEffect(() => {
    return () => {
      // Ensure detail queries are re-enabled after leaving the page.
      setDeleting(false);
    };
  }, [setDeleting]);

  /**
   * Handles event update submission
   * Note: Caller is responsible for closing the modal on success
   */
  const handleEditSubmit = (
    { id, title, description, icon, participants, participantReplacements }: EventFormData,
    onSuccess?: () => void,
  ) => {
    if (id) {
      updateEvent.mutate(
        {
          id,
          data: {
            title,
            description,
            icon,
            participants,
            participantReplacements,
          },
        },
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
   * Toggles event status between active and archived
   */
  const handleToggleArchive = () => {
    if (!event) {
      return;
    }

    updateEvent.mutate({
      id: event.id,
      data: {
        status: event.status === 'archived' ? 'active' : 'archived',
      },
    });
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
    refetch,
    // Handlers
    handleEditSubmit,
    handleDelete,
    handleToggleArchive,
    handleBack,
    isMutatingEvent: updateEvent.isPending,
  };
}
