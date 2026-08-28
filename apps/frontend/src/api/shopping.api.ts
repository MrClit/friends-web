import { apiRequest } from './client';
import type { ShoppingItem, CreateShoppingItemDto, UpdateShoppingItemDto } from './types';

/**
 * Shopping list API endpoints
 * All methods use the apiRequest wrapper for consistent error handling
 */
export const shoppingApi = {
  /**
   * Get the whole shopping list of an event, in insertion order
   * @param eventId - Event ID
   * @returns List of shopping items
   */
  getByEvent: (eventId: string) => apiRequest<ShoppingItem[]>(`/events/${eventId}/shopping-items`),

  /**
   * Add an item to the shopping list of an event
   * @param eventId - Event ID
   * @param dto - Item data
   * @returns Created item
   */
  create: (eventId: string, dto: CreateShoppingItemDto) =>
    apiRequest<ShoppingItem>(`/events/${eventId}/shopping-items`, {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  /**
   * Rename an item or toggle its purchased state
   * @param id - Item ID
   * @param dto - Fields to change
   * @returns Updated item
   */
  update: (id: string, dto: UpdateShoppingItemDto) =>
    apiRequest<ShoppingItem>(`/shopping-items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  /**
   * Delete an item
   * @param id - Item ID
   * @returns void
   */
  delete: (id: string) =>
    apiRequest<void>(`/shopping-items/${id}`, {
      method: 'DELETE',
    }),
};
