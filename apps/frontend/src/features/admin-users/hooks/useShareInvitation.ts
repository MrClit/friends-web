import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { ENV } from '@/config/env';
import { useShareText } from '@/shared/hooks/useShareText';

/**
 * Share the invitation message for a user: the app link plus the exact email they must sign in with,
 * since OAuth only recognises the account the admin registered.
 *
 * Synchronous on purpose, like `useShareText`: call it straight from a click handler so iOS Safari
 * still treats the share as part of the user gesture. The message goes out in the admin's current
 * language, because invited users have no stored language yet.
 */
export function useShareInvitation() {
  const { t } = useTranslation('adminUsers');
  const { shareText } = useShareText({
    ns: 'adminUsers',
    copiedKey: 'invitation.copied',
    errorKey: 'invitation.copyError',
  });

  const shareInvitation = useCallback(
    (email: string) => {
      const url = `${window.location.origin}${ENV.BASE_URL}`;
      shareText(t('invitation.message', { appName: ENV.APP_NAME, url, email }));
    },
    [shareText, t],
  );

  return { shareInvitation };
}
