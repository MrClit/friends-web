import { useOutletContext } from 'react-router-dom';
import type { EventKPIs } from '@/api/types';
import type { Event } from '../types';

/**
 * Data the event layout hands down to its children. The layout resolves the
 * loading, error and not-found states of the event, so `event` is always
 * present here. KPIs are secondary: the layout does not block on them, so their
 * own state travels along for the views that cannot render without them.
 */
export interface EventLayoutContext {
  event: Event;
  kpis: EventKPIs | undefined;
  isLoadingKpis: boolean;
  kpisError: Error | null;
  refetchKpis: () => void;
}

export function useEventLayoutContext(): EventLayoutContext {
  return useOutletContext<EventLayoutContext>();
}
