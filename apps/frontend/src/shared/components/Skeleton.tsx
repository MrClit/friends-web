import { cn } from '@/shared/utils';

interface SkeletonProps {
  className?: string;
}

/**
 * Base skeleton component for loading states.
 * Displays an animated shimmer effect while content is loading.
 */
export default function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('animate-pulse rounded-md bg-teal-200/50 dark:bg-teal-700/30', className)} />;
}
