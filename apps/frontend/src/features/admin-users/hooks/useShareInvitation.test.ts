import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useShareText } from '@/shared/hooks/useShareText';

import { useShareInvitation } from './useShareInvitation';

const shareTextMock = vi.fn();

vi.mock('@/config/env', () => ({
  ENV: { APP_NAME: 'Friends', BASE_URL: '/friends-web/' },
}));

vi.mock('@/shared/hooks/useShareText', () => ({
  useShareText: vi.fn(() => ({ shareText: shareTextMock })),
}));

// Echo the key and its interpolation values, so the test pins what reaches the message.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, string>) => `${key} ${JSON.stringify(values)}`,
  }),
}));

describe('useShareInvitation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shares a message carrying the app link and the email to sign in with', () => {
    const { result } = renderHook(() => useShareInvitation());

    result.current.shareInvitation('new@test.com');

    expect(shareTextMock).toHaveBeenCalledTimes(1);
    const text = shareTextMock.mock.calls[0][0] as string;
    expect(text).toContain('invitation.message');
    expect(text).toContain('"email":"new@test.com"');
    expect(text).toContain(`"url":"${window.location.origin}/friends-web/"`);
    expect(text).toContain('"appName":"Friends"');
  });

  it('reports the copy outcome with the admin-users toasts', () => {
    renderHook(() => useShareInvitation());

    expect(vi.mocked(useShareText)).toHaveBeenCalledWith({
      ns: 'adminUsers',
      copiedKey: 'invitation.copied',
      errorKey: 'invitation.copyError',
    });
  });
});
