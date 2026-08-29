import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvent, useUpdateEvent, useDeleteEvent } from '@/hooks/api/useEvents';
import { useEventKPIs } from '@/hooks/api/useEventKPIs';
import { useDeletingStore } from '@/shared/store/useDeletingStore';

export function useEventDetail(id: string | undefined) {
  const navigate = useNavigate();
  const setDeleting = useDeletingStore((state) => state.setDeleting);

  const { data: event, isLoading, error, refetch } = useEvent(id);
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const { data: kpis, isLoading: isLoadingKpis, error: kpisError, refetch: refetchKpis } = useEventKPIs(id);

  useEffect(() => {
    return () => {
      // Re-enable detail queries after leaving the page.
      setDeleting(false);
    };
  }, [setDeleting]);

  const handleDelete = () => {
    if (event) {
      deleteEvent.mutate(event.id, {
        onSuccess: () => {
          navigate('/');
        },
      });
    }
  };

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

  const handleBack = () => navigate('/');

  const handleBackToEvent = () => {
    if (!event) {
      return;
    }

    navigate(`/event/${event.id}`);
  };

  return {
    event,
    kpis,
    isLoading,
    error,
    refetch,
    isLoadingKpis,
    kpisError,
    refetchKpis,
    handleDelete,
    handleToggleArchive,
    handleBack,
    handleBackToEvent,
    isMutatingEvent: updateEvent.isPending,
  };
}
