import type { ShoppingItem } from '@/api/types';
import { SHARE_BULLET, SHARE_TITLE_EMOJI, SHARE_TITLE_SEPARATOR } from '../constants';

interface BuildShoppingListTextInput {
  /** The whole list; filtering the pending items out is this function's job. */
  items: readonly ShoppingItem[];
  eventTitle: string;
  /** Already translated, e.g. 'Lista de la compra'. */
  headerLabel: string;
  /** Already translated and pluralized, e.g. '3 items pendientes'. */
  countLabel: string;
}

/**
 * Render the pending items as plain text ready to paste into a messaging app.
 *
 * Takes the labels already translated so the function stays pure and free of i18n, which is what makes
 * the exact output cheap to pin in a test. Names are emitted verbatim: whatever somebody typed is what
 * the group reads.
 */
export function buildShoppingListText({
  items,
  eventTitle,
  headerLabel,
  countLabel,
}: BuildShoppingListTextInput): string {
  const pending = items.filter((item) => item.purchasedAt === null);

  const lines = [
    `*${SHARE_TITLE_EMOJI} ${headerLabel}${SHARE_TITLE_SEPARATOR}${eventTitle}*`,
    '',
    ...pending.map((item) => `${SHARE_BULLET}${item.name}`),
    '',
    countLabel,
  ];

  return lines.join('\n');
}
