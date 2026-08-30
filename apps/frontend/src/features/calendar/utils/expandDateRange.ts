import { MAX_DAYS_PER_REQUEST } from '../constants';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Expand an inclusive date range into individual `YYYY-MM-DD` days.
 *
 * The range is sugar that lives only in this form: the API stores and returns individual days, so the
 * expansion happens here. Arithmetic is done entirely in UTC and the result is formatted back from UTC
 * parts — going through the local timezone is what makes a September range in Europe/Madrid come out
 * shifted by a day once daylight saving is in the way.
 *
 * @param from - First day, inclusive, as YYYY-MM-DD
 * @param to - Last day, inclusive, as YYYY-MM-DD
 * @returns The days in ascending order, or [] if either bound is malformed or the range is inverted
 */
export function expandDateRange(from: string, to: string): string[] {
  if (!DATE_PATTERN.test(from) || !DATE_PATTERN.test(to)) return [];

  const start = Date.parse(`${from}T00:00:00.000Z`);
  const end = Date.parse(`${to}T00:00:00.000Z`);

  if (Number.isNaN(start) || Number.isNaN(end) || start > end) return [];

  // A date the regex allows but the calendar does not have, such as 2026-02-31, parses to the wrong
  // day. Rejecting it here keeps the request from failing at the backend for something we can see.
  if (toIsoDate(start) !== from || toIsoDate(end) !== to) return [];

  const days: string[] = [];
  for (let day = start; day <= end && days.length < MAX_DAYS_PER_REQUEST; day += MS_PER_DAY) {
    days.push(toIsoDate(day));
  }

  return days;
}

function toIsoDate(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}
