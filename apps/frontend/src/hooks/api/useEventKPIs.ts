import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '@/api/events.api';
import { queryKeys } from '@/hooks/api/keys';
import { useDeletingStore } from '@/shared/store/useDeletingStore';

/**
 * Hook to fetch KPIs from the backend
 * @param eventId - Event ID
 * @returns Object with KPIs and loading state
 */
export function useEventKPIs(eventId?: string) {
  const isDeleting = useDeletingStore((state) => state.isDeleting);
  const safeEventId = eventId ?? '';

  return useQuery({
    queryKey: queryKeys.events.kpis(safeEventId),
    queryFn: () => eventsApi.getKPIs(safeEventId),
    enabled: !!safeEventId && !isDeleting,
  });
}
