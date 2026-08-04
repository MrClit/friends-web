import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthCallback } from './AuthCallback';

const navigateMock = vi.fn();
const setAuthMock = vi.fn();

const { exchangeCodeMock, getCurrentUserMock, setAccessTokenMock } = vi.hoisted(() => ({
  exchangeCodeMock: vi.fn(),
  getCurrentUserMock: vi.fn(),
  setAccessTokenMock: vi.fn(),
}));

vi.mock('@/config/env', () => ({
  ENV: { API_URL: 'http://test.api' },
}));

vi.mock('@/api/client', () => ({
  REFRESH_TOKEN_KEY: 'refresh_token',
  setAccessToken: setAccessTokenMock,
}));

vi.mock('@/api/auth.api', () => ({
  authApi: {
    exchangeCode: exchangeCodeMock,
    getCurrentUser: getCurrentUserMock,
  },
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

function renderCallback(search: string) {
  return render(
    <MemoryRouter initialEntries={[`/auth/callback${search}`]}>
      <AuthCallback />
    </MemoryRouter>,
  );
}

describe('AuthCallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redeems the exchange code, stores the refresh token and authenticates the user', async () => {
    exchangeCodeMock.mockResolvedValueOnce({ accessToken: 'access-jwt', refreshToken: 'refresh-raw' });
    getCurrentUserMock.mockResolvedValueOnce({ id: 'user-1', email: 'user@test.com', name: 'User', role: 'user' });

    renderCallback('?success=true&code=one-time-code');

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/', { replace: true });
    });

    expect(exchangeCodeMock).toHaveBeenCalledWith('one-time-code');
    expect(localStorage.getItem('refresh_token')).toBe('refresh-raw');
    expect(setAuthMock).toHaveBeenCalledWith(
      { id: 'user-1', email: 'user@test.com', name: 'User', avatar: undefined, role: 'user' },
      'access-jwt',
    );
  });

  it('hands the access token to the API client before requesting the profile', async () => {
    exchangeCodeMock.mockResolvedValueOnce({ accessToken: 'access-jwt', refreshToken: 'refresh-raw' });
    getCurrentUserMock.mockResolvedValueOnce({ id: 'user-1', email: 'user@test.com', role: 'user' });

    renderCallback('?success=true&code=one-time-code');

    await waitFor(() => {
      expect(getCurrentUserMock).toHaveBeenCalled();
    });

    expect(setAccessTokenMock).toHaveBeenCalledWith('access-jwt');
    expect(setAccessTokenMock.mock.invocationCallOrder[0]).toBeLessThan(getCurrentUserMock.mock.invocationCallOrder[0]);
  });

  it('navigates home unauthenticated when the exchange fails', async () => {
    exchangeCodeMock.mockRejectedValueOnce(new Error('Invalid or expired exchange code'));

    renderCallback('?success=true&code=stale-code');

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/', { replace: true });
    });

    expect(setAuthMock).not.toHaveBeenCalled();
    expect(getCurrentUserMock).not.toHaveBeenCalled();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });

  it('clears the access token when the profile request fails after a valid exchange', async () => {
    exchangeCodeMock.mockResolvedValueOnce({ accessToken: 'access-jwt', refreshToken: 'refresh-raw' });
    getCurrentUserMock.mockRejectedValueOnce(new Error('me failed'));

    renderCallback('?success=true&code=one-time-code');

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/', { replace: true });
    });

    expect(setAuthMock).not.toHaveBeenCalled();
    expect(setAccessTokenMock).toHaveBeenLastCalledWith(null);
  });

  it('navigates home without calling the API when no code is present', async () => {
    renderCallback('?success=true');

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/', { replace: true });
    });

    expect(exchangeCodeMock).not.toHaveBeenCalled();
    expect(setAuthMock).not.toHaveBeenCalled();
  });

  it('renders the loading state while the exchange is in flight', () => {
    exchangeCodeMock.mockReturnValue(new Promise(() => {}));

    renderCallback('?success=true&code=one-time-code');

    expect(screen.getByText('loading')).toBeInTheDocument();
  });
});
