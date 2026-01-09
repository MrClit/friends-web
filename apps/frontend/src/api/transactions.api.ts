import { apiRequest } from './client';
import type { Transaction, CreateTransactionDto, UpdateTransactionDto, PaginatedTransactionsResponse } from './types';

/**
 * Transactions API endpoints
 * All methods use the apiRequest wrapper for consistent error handling
 */
export const transactionsApi = {
  /**
   * Get all transactions for an event
   * @param eventId - Event ID
   * @returns List of transactions
   */
  getByEvent: (eventId: string) => apiRequest<Transaction[]>(`/events/${eventId}/transactions`),

  /**
   * Get paginated transactions by unique dates
   * Special pagination: groups by unique dates, not item count
   * @param eventId - Event ID
   * @param numberOfDates - Number of unique dates to fetch
   * @param offset - Offset for pagination (number of dates to skip)
   * @returns Paginated response with transactions and metadata
   */
  getPaginated: (eventId: string, numberOfDates: number, offset: number) =>
    apiRequest<PaginatedTransactionsResponse>(
      `/events/${eventId}/transactions/paginated?numberOfDates=${numberOfDates}&offset=${offset}`,
    ),

  /**
   * Get transaction by ID
   * @param id - Transaction ID
   * @returns Transaction details
   */
  getById: (id: string) => apiRequest<Transaction>(`/transactions/${id}`),

  /**
   * Create a new transaction
   * @param eventId - Event ID
   * @param dto - Transaction data
   * @returns Created transaction
   */
  create: (eventId: string, dto: CreateTransactionDto) =>
    apiRequest<Transaction>(`/events/${eventId}/transactions`, {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  /**
   * Update an existing transaction
   * @param id - Transaction ID
   * @param dto - Updated transaction data
   * @returns Updated transaction
   */
  update: (id: string, dto: UpdateTransactionDto) =>
    apiRequest<Transaction>(`/transactions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  /**
   * Delete a transaction
   * @param id - Transaction ID
   * @returns void
   */
  delete: (id: string) =>
    apiRequest<void>(`/transactions/${id}`, {
      method: 'DELETE',
    }),
};
