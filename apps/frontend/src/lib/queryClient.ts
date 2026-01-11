import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime in v4)
      refetchOnWindowFocus: false, // Disabled to avoid unnecessary refetches on window focus
      refetchOnReconnect: false, // Disabled to avoid unnecessary refetches on reconnect
      retry: 3,
    },
    mutations: {
      retry: 1,
      onError: (error: unknown) => {
        console.error('Mutation error:', error);
        // TODO: Integrate Sentry or another logger in production
      },
    },
  },
});

// Global error handler for queries
queryClient.getQueryCache().subscribe((event) => {
  if (event.type === 'updated' && event.query.state.status === 'error') {
    console.error('Query error:', event.query.state.error);
    // TODO: Integrate Sentry or another logger in production
  }
});
