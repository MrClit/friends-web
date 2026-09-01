import { describe, it, expect } from 'vitest';
import { MealSlot } from '@friends/shared-types';
import type { CalendarDay } from '@/api/types';
import { attendanceOf, calendarTotals } from './calendarTotals';

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
        description: 'Paella',
        attendances: [
          { id: 'a1', mealId: 'lunch-1', participantId: 'maria', adults: 1, children: 0 },
          { id: 'a2', mealId: 'lunch-1', participantId: 'gil', adults: 2, children: 3 },
        ],
      },
      {
        id: 'dinner-1',
        dayId: 'day-1',
        slot: MealSlot.DINNER,
        description: null,
        attendances: [{ id: 'a3', mealId: 'dinner-1', participantId: 'gil', adults: 2, children: 1 }],
      },
    ],
  },
  {
    id: 'day-2',
    eventId: 'event-1',
    date: '2026-09-13',
    description: null,
    meals: [
      {
        id: 'lunch-2',
        dayId: 'day-2',
        slot: MealSlot.LUNCH,
        description: null,
        attendances: [{ id: 'a4', mealId: 'lunch-2', participantId: 'maria', adults: 1, children: 0 }],
      },
    ],
  },
];

describe('calendarTotals', () => {
  it('totals each sitting', () => {
    const { byMeal } = calendarTotals(buildCalendar());

    expect(byMeal['lunch-1']).toEqual({ adults: 3, children: 3, total: 6 });
    expect(byMeal['dinner-1']).toEqual({ adults: 2, children: 1, total: 3 });
    expect(byMeal['lunch-2']).toEqual({ adults: 1, children: 0, total: 1 });
  });

  it('totals each participant across the whole calendar', () => {
    const { byParticipant } = calendarTotals(buildCalendar());

    expect(byParticipant['maria']).toEqual({ adults: 2, children: 0, total: 2 });
    expect(byParticipant['gil']).toEqual({ adults: 4, children: 4, total: 8 });
  });

  it('totals everything', () => {
    expect(calendarTotals(buildCalendar()).overall).toEqual({ adults: 6, children: 4, total: 10 });
  });

  it('gives a sitting nobody signed up to a zero total rather than leaving it out', () => {
    const days = buildCalendar();
    days[0].meals[1].attendances = [];

    expect(calendarTotals(days).byMeal['dinner-1']).toEqual({ adults: 0, children: 0, total: 0 });
  });

  it('handles an empty calendar', () => {
    expect(calendarTotals([])).toEqual({
      byMeal: {},
      byParticipant: {},
      overall: { adults: 0, children: 0, total: 0 },
    });
  });

  it('does not report a participant who is signed up nowhere', () => {
    expect(calendarTotals(buildCalendar()).byParticipant['joan']).toBeUndefined();
  });
});

describe('attendanceOf', () => {
  it('returns the stored counts', () => {
    const meal = buildCalendar()[0].meals[0];

    expect(attendanceOf(meal, 'gil')).toEqual({ adults: 2, children: 3 });
  });

  it('reads an empty cell as zero', () => {
    const meal = buildCalendar()[0].meals[0];

    expect(attendanceOf(meal, 'joan')).toEqual({ adults: 0, children: 0 });
  });
});
