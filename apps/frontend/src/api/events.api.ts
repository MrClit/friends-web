import { apiRequest } from './client';
import type { Event, CreateEventDto, UpdateEventDto } from './types';

/**
 * Events API endpoints
 * All methods use the apiRequest wrapper for consistent error handling
 */
export const eventsApi = {
  /**
   * Get all events
   * @returns List of all events
   */
  getAll: () => apiRequest<Event[]>('/events'),

  /**
   * Get event by ID
   * @param id - Event ID
   * @returns Event details
   */
  getById: (id: string) => apiRequest<Event>(`/events/${id}`),

  /**
   * Create a new event
   * @param dto - Event data
   * @returns Created event
   */
  create: (dto: CreateEventDto) =>
    apiRequest<Event>('/events', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  /**
   * Update an existing event
   * @param id - Event ID
   * @param dto - Updated event data
   * @returns Updated event
   */
  update: (id: string, dto: UpdateEventDto) =>
    apiRequest<Event>(`/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  /**
   * Delete an event
   * Backend handles cascade delete of transactions
   * @param id - Event ID
   * @returns void
   */
  delete: (id: string) =>
    apiRequest<void>(`/events/${id}`, {
      method: 'DELETE',
    }),
};
