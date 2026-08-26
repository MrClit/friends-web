import { EventSectionSkeleton } from '@/features/events/components/EventSectionSkeleton';
import { useEventLayoutContext } from '@/features/events/hooks';
import { ShoppingList } from '@/features/shopping';
import { useI18nNamespacesReady } from '@/shared/hooks/useI18nNamespacesReady';

const SHOPPING_SECTION_NAMESPACES = ['eventDetail', 'shopping', 'common'] as const;

/**
 * Shopping section of the event hub: the shared list of what is still to buy.
 * The event is resolved by EventLayout and arrives through the outlet context.
 */
export function EventShoppingSection() {
  const { event } = useEventLayoutContext();
  const isI18nReady = useI18nNamespacesReady(SHOPPING_SECTION_NAMESPACES);

  if (!isI18nReady) {
    return <EventSectionSkeleton />;
  }

  return <ShoppingList event={event} />;
}
