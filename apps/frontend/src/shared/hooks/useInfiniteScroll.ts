import { useEffect, useRef, useState, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  onLoadMore: () => void | Promise<void>;
  hasMore: boolean;
  threshold?: number;
}

interface UseInfiniteScrollReturn {
  observerRef: React.RefObject<HTMLDivElement | null>;
  isLoading: boolean;
}

/**
 * Custom hook for implementing infinite scroll with IntersectionObserver
 *
 * @param options - Configuration options
 * @param options.onLoadMore - Callback function to load more data
 * @param options.hasMore - Whether there is more data to load
 * @param options.threshold - Intersection threshold (0-1), defaults to 0.1
 *
 * @returns Object with observerRef (attach to trigger element) and isLoading state
 *
 * @example
 * ```tsx
 * const loadMore = useCallback(() => {
 *   setPage(prev => prev + 1);
 * }, []);
 *
 * const { observerRef, isLoading } = useInfiniteScroll({
 *   onLoadMore: loadMore,
 *   hasMore: hasMoreData,
 *   threshold: 0.1,
 * });
 *
 * return (
 *   <div>
 *     {items.map(item => <Item key={item.id} {...item} />)}
 *     {hasMoreData && (
 *       <div ref={observerRef}>
 *         {isLoading ? 'Loading...' : 'Load more'}
 *       </div>
 *     )}
 *   </div>
 * );
 * ```
 */
export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  threshold = 0.1,
}: UseInfiniteScrollOptions): UseInfiniteScrollReturn {
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);

  // Wrap onLoadMore in useCallback to prevent unnecessary effect triggers
  const handleLoadMore = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      await onLoadMore();
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, onLoadMore]);

  useEffect(() => {
    const element = observerRef.current;
    if (!element || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // When the trigger element enters the viewport
        if (entries[0].isIntersecting && !isLoading) {
          handleLoadMore();
        }
      },
      {
        threshold,
        // Optional: add rootMargin to trigger slightly before element is visible
        // rootMargin: '100px',
      },
    );

    observer.observe(element);

    // Cleanup observer on unmount or when dependencies change
    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoading, handleLoadMore, threshold]);

  return { observerRef, isLoading };
}
