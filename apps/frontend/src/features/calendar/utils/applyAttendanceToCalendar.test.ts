import { describe, it, expect } from 'vitest';
import { MealSlot } from '@friends/shared-types';
import type { CalendarDay } from '@/api/types';
import { applyAttendanceToCalendar } from './applyAttendanceToCalendar';
import { attendanceOf } from './calendarTotals';

const buildCalendar = (): CalendarDay[] => [
  {
    id: 'day-1',
    eventId: 'event-1',
    date: '2026-09-12',
    description: null,
    meals: [
      {
        id: 'lunch-1',
        dayId: 'day-1',
        slot: MealSlot.LUNCH,
        description: null,
        attendances: [{ id: 'a1', mealId: 'lunch-1', participantId: 'gil', adults: 2, children: 3 }],
      },
      {
        id: 'dinner-1',
        dayId: 'day-1',
        slot: MealSlot.DINNER,
        description: null,
        attendances: [{ id: 'a2', mealId: 'dinner-1', participantId: 'gil', adults: 1, children: 1 }],
      },
    ],
  },
];

describe('applyAttendanceToCalendar', () => {
  it('updates a cell that already had a value', () => {
    const result = applyAttendanceToCalendar(buildCalendar(), 'lunch-1', {
      participantId: 'gil',
      adults: 4,
      children: 1,
    });

    expect(attendanceOf(result[0].meals[0], 'gil')).toEqual({ adults: 4, children: 1 });
    expect(result[0].meals[0].attendances).toHaveLength(1);
  });

  it('adds a row the first time a cell is filled in', () => {
    const result = applyAttendanceToCalendar(buildCalendar(), 'lunch-1', {
      participantId: 'maria',
      adults: 1,
      children: 0,
    });

    expect(attendanceOf(result[0].meals[0], 'maria')).toEqual({ adults: 1, children: 0 });
    expect(result[0].meals[0].attendances).toHaveLength(2);
  });

  // The sparse contract: zeros are the absence of a row, not a row full of zeros. Storing one would
  // disagree with the payload that comes back on the next refetch.
  it('removes the row when the cell goes back to zero', () => {
    const result = applyAttendanceToCalendar(buildCalendar(), 'lunch-1', {
      participantId: 'gil',
      adults: 0,
      children: 0,
    });

    expect(result[0].meals[0].attendances).toHaveLength(0);
    expect(attendanceOf(result[0].meals[0], 'gil')).toEqual({ adults: 0, children: 0 });
  });

  it('does not add a row when an empty cell is set to zero', () => {
    const result = applyAttendanceToCalendar(buildCalendar(), 'lunch-1', {
      participantId: 'maria',
      adults: 0,
      children: 0,
    });

    expect(result[0].meals[0].attendances).toHaveLength(1);
  });

  it('leaves the other sittings of the same day untouched', () => {
    const result = applyAttendanceToCalendar(buildCalendar(), 'lunch-1', {
      participantId: 'gil',
      adults: 9,
      children: 9,
    });

    expect(attendanceOf(result[0].meals[1], 'gil')).toEqual({ adults: 1, children: 1 });
  });

  it('does not mutate the calendar it was given', () => {
    const days = buildCalendar();

    applyAttendanceToCalendar(days, 'lunch-1', { participantId: 'gil', adults: 7, children: 0 });

    expect(attendanceOf(days[0].meals[0], 'gil')).toEqual({ adults: 2, children: 3 });
  });

  it('returns the calendar unchanged for a sitting it does not contain', () => {
    const days = buildCalendar();

    const result = applyAttendanceToCalendar(days, 'unknown-meal', {
      participantId: 'gil',
      adults: 1,
      children: 0,
    });

    expect(result).toEqual(days);
  });
});
