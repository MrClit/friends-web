/** Maximum length of an item name, matching the backend DTO. */
export const SHOPPING_ITEM_MAX_LENGTH = 120;

/**
 * How often the list refetches while the section is open. A supermarket cadence: short enough that a
 * partner's tick shows up before you re-read the list, long enough not to burn battery.
 */
export const SHOPPING_POLL_INTERVAL_MS = 15_000;

/**
 * Kept below the poll interval on purpose: refetchOnWindowFocus only refetches a *stale* query, so a
 * longer staleTime would silently disable the refresh-on-focus half of the contract.
 */
export const SHOPPING_STALE_TIME_MS = 10_000;

/** Plain-text export format. WhatsApp renders *single asterisks* as bold. */
export const SHARE_BULLET = '• ';
export const SHARE_TITLE_EMOJI = '🛒';
export const SHARE_TITLE_SEPARATOR = ' — ';
