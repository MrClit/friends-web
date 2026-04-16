import { cn } from '@/shared/utils';

interface SkeletonProps {
  className?: string;
}

/**
 * Base skeleton component for loading states.
 * Displays an animated shimmer effect while content is loading.
 */
export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('animate-pulse rounded-md bg-emerald-200/50 dark:bg-emerald-700/30', className)} />;
}
