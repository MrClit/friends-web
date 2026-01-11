import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '@/api/events.api';
import { queryKeys } from '@/hooks/api/keys';

/**
 * Hook to fetch KPIs from the backend
 * @param eventId - Event ID
 * @returns Object with KPIs and loading state
 */
export function useEventKPIs(eventId: string) {
  return useQuery({
    queryKey: queryKeys.events.kpis(eventId),
    queryFn: () => eventsApi.getKPIs(eventId),
    enabled: !!eventId,
  });
}
