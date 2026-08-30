/**
 * How many days one request may add, mirroring the backend DTO. The range is expanded here on the
 * client, so a mistyped one is a keystroke away from an enormous request.
 */
export const MAX_DAYS_PER_REQUEST = 60;

/** Upper bound per cell, mirroring the backend DTO. */
export const MAX_ATTENDEES_PER_CELL = 999;
