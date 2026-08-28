import { useOutletContext } from 'react-router-dom';
import type { EventKPIs } from '@/api/types';
import type { Event } from '../types';

/**
 * Data the event layout hands down to its sections. The layout resolves the
 * loading, error and not-found states, so `event` is always present here.
 */
export interface EventLayoutContext {
  event: Event;
  kpis: EventKPIs | undefined;
}

export function useEventLayoutContext(): EventLayoutContext {
  return useOutletContext<EventLayoutContext>();
}
