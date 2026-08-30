import { EventSectionSkeleton } from '@/features/events/components/EventSectionSkeleton';
import { useEventLayoutContext } from '@/features/events/hooks';
import { CalendarPlanning } from '@/features/calendar';
import { useI18nNamespacesReady } from '@/shared/hooks/useI18nNamespacesReady';

// Module level, not inline: this tuple is a dependency of the effect inside the hook, and a fresh
// reference on every render would make it loop.
const CALENDAR_SECTION_NAMESPACES = ['eventDetail', 'calendar', 'events', 'common'] as const;

/**
 * Calendar section of the event hub: who is coming to each lunch and dinner.
 * The event is resolved by EventLayout and arrives through the outlet context.
 */
export function EventCalendarSection() {
  const { event } = useEventLayoutContext();
  const isI18nReady = useI18nNamespacesReady(CALENDAR_SECTION_NAMESPACES);

  if (!isI18nReady) {
    return <EventSectionSkeleton />;
  }

  return <CalendarPlanning event={event} />;
}
