import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos (antes cacheTime en v4)
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 3,
    },
    mutations: {
      retry: 1,
    },
  },
});
