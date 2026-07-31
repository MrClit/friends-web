import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthCallback } from './AuthCallback';

const navigateMock = vi.fn();
const setAuthMock = vi.fn();

vi.mock('@/config/env', () => ({
  ENV: { API_URL: 'http://test.api' },
}));

vi.mock('@/api/client', () => ({
  REFRESH_TOKEN_KEY: 'refresh_token',
}));

vi.mock('@/features/auth/useAuth', () => ({
  useAuth: () => ({ setAuth: setAuthMock }),
}));

vi.mock('@/shared/hooks/useI18nNamespacesReady', () => ({
  useI18nNamespacesReady: () => true,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

function renderCallback(search: string) {
  return render(
    <MemoryRouter initialEntries={[`/auth/callback${search}`]}>
      <AuthCallback />
    </MemoryRouter>,
  );
}

describe('AuthCallback', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.clearAllMocks();
  });

  it('redeems the exchange code, stores the refresh token and authenticates the user', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(200, { data: { accessToken: 'access-jwt', refreshToken: 'refresh-raw' } }))
      .mockResolvedValueOnce(
        jsonResponse(200, { data: { id: 'user-1', email: 'user@test.com', name: 'User', role: 'user' } }),
      );

    renderCallback('?success=true&code=one-time-code');

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/', { replace: true });
    });

    const exchangeCall = vi.mocked(fetch).mock.calls[0];
    expect(String(exchangeCall[0])).toBe('http://test.api/auth/exchange');
    expect(JSON.parse((exchangeCall[1] as RequestInit).body as string)).toEqual({ code: 'one-time-code' });

    expect(localStorage.getItem('refresh_token')).toBe('refresh-raw');
    expect(setAuthMock).toHaveBeenCalledWith(
      { id: 'user-1', email: 'user@test.com', name: 'User', avatar: undefined, role: 'user' },
      'access-jwt',
    );
  });

  it('navigates home unauthenticated when the exchange fails', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(401, { message: 'Invalid or expired exchange code' }));

    renderCallback('?success=true&code=stale-code');

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/', { replace: true });
    });

    expect(setAuthMock).not.toHaveBeenCalled();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });

  it('navigates home without calling the API when no code is present', async () => {
    renderCallback('?success=true');

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/', { replace: true });
    });

    expect(fetch).not.toHaveBeenCalled();
    expect(setAuthMock).not.toHaveBeenCalled();
  });

  it('renders the loading state while the exchange is in flight', () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}));

    renderCallback('?success=true&code=one-time-code');

    expect(screen.getByText('loading')).toBeInTheDocument();
  });
});
