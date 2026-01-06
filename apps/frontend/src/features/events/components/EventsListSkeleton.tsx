import Skeleton from '@/shared/components/Skeleton';

/**
 * Skeleton loader for EventsList component.
 * Shows 3 placeholder cards while events are loading.
 */
export default function EventsListSkeleton() {
  return (
    <div className="w-full max-w-2xl mt-4 sm:mt-8">
      <Skeleton className="h-7 w-32 mb-4" />
      <ul className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <li key={i}>
            <div className="block px-4 py-3 rounded-lg bg-white dark:bg-teal-800 shadow border border-teal-100 dark:border-teal-700">
              <div className="flex flex-col space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
