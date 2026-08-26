import { useCallback } from 'react';
import { useToast } from '@/shared/hooks/useToast';
import { legacyCopyToClipboard } from '../utils/legacyCopyToClipboard';

/**
 * Send a piece of text out of the app: the native share sheet where it exists (one tap to WhatsApp on
 * mobile), the clipboard everywhere else.
 *
 * Everything before the share/clipboard call is synchronous on purpose. iOS Safari only honours those
 * two APIs inside the user gesture that triggered them, so the caller must have the text already built
 * from data in hand: no await, no fetch, no dynamic import on the way here.
 */
export function useShareShoppingList() {
  const { success, error } = useToast();

  const copyToClipboard = useCallback(
    (text: string) => {
      const notifyCopied = () => success('share_copied', undefined, undefined, { ns: 'shopping' });
      const fallback = () => {
        if (legacyCopyToClipboard(text)) {
          notifyCopied();
        } else {
          error('share_error', undefined, { ns: 'shopping' });
        }
      };

      if (typeof navigator.clipboard?.writeText !== 'function') {
        fallback();
        return;
      }

      navigator.clipboard.writeText(text).then(notifyCopied, fallback);
    },
    [success, error],
  );

  const shareText = useCallback(
    (text: string) => {
      if (typeof navigator.share !== 'function') {
        copyToClipboard(text);
        return;
      }

      navigator.share({ text }).catch((err: unknown) => {
        // The user dismissed the share sheet. Copying instead would announce "list copied" for an
        // action they just cancelled, so this path stays silent.
        if (err instanceof DOMException && err.name === 'AbortError') return;
        copyToClipboard(text);
      });
    },
    [copyToClipboard],
  );

  return { shareText };
}
