import { Skeleton } from '@/shared/components/Skeleton';

/**
 * Skeleton for the body of an event section (KPI grid + list items),
 * used as the Suspense fallback while a section chunk loads.
 */
export function EventSectionSkeleton() {
  return (
    <div className="animate-in fade-in duration-300">
      {/* KPI grid skeleton */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 sm:h-24 rounded-xl" />
        ))}
      </section>

      {/* List skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
