/**
 * Centralized query keys for React Query cache management
 *
 * Benefits:
 * - TypeScript autocomplete
 * - Easy invalidation of related queries
 * - Prevents typos
 * - Single source of truth
 */
export const queryKeys = {
  events: {
    /**
     * Key for all events list
     */
    all: ['events'] as const,

    /**
     * Key for specific event detail
     * @param id - Event ID
     */
    detail: (id: string) => ['events', id] as const,

    /**
     * Key for event KPIs
     * @param id - Event ID
     */
    kpis: (id: string) => ['events', id, 'kpis'] as const,
  },

  transactions: {
    /**
     * Key for all transactions
     */
    all: ['transactions'] as const,

    /**
     * Key for transactions by event
     * @param eventId - Event ID
     */
    byEvent: (eventId: string) => ['transactions', 'event', eventId] as const,

    /**
     * Key for paginated transactions by event
     * @param eventId - Event ID
     * @param params - Pagination params
     */
    paginated: (eventId: string, params: { numberOfDates: number; offset: number }) =>
      ['transactions', 'event', eventId, 'paginated', params] as const,

    /**
     * Key for specific transaction detail
     * @param id - Transaction ID
     */
    detail: (id: string) => ['transactions', id] as const,
  },
};
