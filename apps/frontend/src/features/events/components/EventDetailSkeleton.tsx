import { Skeleton } from '@/shared/components/Skeleton';

/**
 * Skeleton loading state that mirrors the EventDetail layout:
 * Header (back button + title + action buttons) + KPI grid (2x2) + transaction list items
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

      {/* KPI grid skeleton */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 sm:h-24 rounded-xl" />
        ))}
      </section>

      {/* Transactions list skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
