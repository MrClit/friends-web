export const MealSlot = {
  LUNCH: 'lunch',
  DINNER: 'dinner',
} as const;

export type MealSlot = (typeof MealSlot)[keyof typeof MealSlot];

/**
 * The slots every calendar day is created with, in presentation order.
 *
 * Ordering by this array and not alphabetically is deliberate: 'dinner' sorts before 'lunch', which is
 * the wrong way round for a day. The slot is stored as text rather than a database enum so that adding
 * one — breakfast is the obvious next — is a change to this list instead of a migration.
 */
export const MEAL_SLOTS: readonly MealSlot[] = [MealSlot.LUNCH, MealSlot.DINNER];
