import { Skeleton } from '@/shared/components/Skeleton';
import { EventSectionSkeleton } from './EventSectionSkeleton';

/**
 * Skeleton loading state that mirrors the event hub layout:
 * Header (back button + title + action buttons) + the section body skeleton.
 */
export function EventDetailSkeleton() {
  return (
    <div className="animate-in fade-in duration-300">
      {/* Header skeleton */}
      <section className="mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
            <Skeleton className="h-7 sm:h-9 w-48 sm:w-64" />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Skeleton className="h-9 w-9 sm:w-24 rounded-lg" />
            <Skeleton className="h-9 w-9 sm:w-24 rounded-lg" />
          </div>
        </div>
      </section>

      <EventSectionSkeleton />
    </div>
  );
}
