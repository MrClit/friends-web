import { apiRequest } from './client';
import type {
  AttendanceCell,
  CalendarDay,
  CalendarMeal,
  CreateCalendarDaysDto,
  SetAttendanceDto,
  UpdateCalendarDayDto,
  UpdateCalendarMealDto,
} from './types';

/**
 * Meal calendar API endpoints
 * All methods use the apiRequest wrapper for consistent error handling
 */
export const calendarApi = {
  /**
   * Get the whole calendar of an event: days, their sittings and who is signed up to each.
   * One request because the planning grid needs all of it at once.
   * @param eventId - Event ID
   * @returns Days ordered by date, each with its sittings in Lunch/Dinner order
   */
  getByEvent: (eventId: string) => apiRequest<CalendarDay[]>(`/events/${eventId}/calendar`),

  /**
   * Add days to the calendar, each with the full set of sittings.
   * Idempotent: dates the event already has are ignored, so an overlapping range is safe to send.
   * @param eventId - Event ID
   * @param dto - Individual dates as YYYY-MM-DD, at most 60, plus an optional shared description
   * @returns Only the days that were created
   */
  addDays: (eventId: string, dto: CreateCalendarDaysDto) =>
    apiRequest<CalendarDay[]>(`/events/${eventId}/calendar/days`, {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  /**
   * Set or clear what a day is about
   * @param dayId - Calendar day ID
   * @param dto - Description to write; null clears it
   * @returns Updated day
   */
  updateDay: (dayId: string, dto: UpdateCalendarDayDto) =>
    apiRequest<CalendarDay>(`/calendar-days/${dayId}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  /**
   * Delete a day, along with its sittings and every attendance on them
   * @param dayId - Calendar day ID
   * @returns void
   */
  deleteDay: (dayId: string) =>
    apiRequest<void>(`/calendar-days/${dayId}`, {
      method: 'DELETE',
    }),

  /**
   * Set or clear the plan of one sitting
   * @param mealId - Calendar meal ID
   * @param dto - Description to write; null clears it
   * @returns Updated sitting
   */
  updateMeal: (mealId: string, dto: UpdateCalendarMealDto) =>
    apiRequest<CalendarMeal>(`/calendar-meals/${mealId}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  /**
   * Write one cell of the planning grid. Both counts at zero removes the entry.
   * @param mealId - Calendar meal ID
   * @param dto - Participant and how many adults and children they bring
   * @returns The resulting state of the cell, zeros included
   */
  setAttendance: (mealId: string, dto: SetAttendanceDto) =>
    apiRequest<AttendanceCell>(`/calendar-meals/${mealId}/attendances`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    }),
};
