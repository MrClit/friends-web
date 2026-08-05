import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { use } from 'react';
import { ApiError } from '@/api/client';
import { AuthProvider, AuthContext } from './AuthContext';

const resetEventFormModal = vi.fn();
const resetTransactionModal = vi.fn();
const resetToast = vi.fn();
const resetDeleting = vi.fn();

const { refreshAccessTokenMock, setAccessTokenMock, getCurrentUserMock, logoutMock } = vi.hoisted(() => ({
  refreshAccessTokenMock: vi.fn(),
  setAccessTokenMock: vi.fn(),
  getCurrentUserMock: vi.fn(),
  logoutMock: vi.fn(),
}));

vi.mock('@/config/env', () => ({
  ENV: { API_URL: 'http://test.api' },
}));

vi.mock('@/api/client', async () => {
  const actual = await vi.importActual<typeof import('@/api/client')>('@/api/client');
  return {
    ...actual,
    REFRESH_TOKEN_KEY: 'refresh_token',
    refreshAccessToken: refreshAccessTokenMock,
    setAccessToken: setAccessTokenMock,
  };
});

vi.mock('@/api/auth.api', () => ({
  authApi: {
    getCurrentUser: getCurrentUserMock,
    logout: logoutMock,
    oauthLoginUrl: (provider: string) => `http://test.api/auth/${provider}`,
  },
}));

vi.mock('@/shared/store/useEventFormModalStore', () => ({
  useEventFormModalStore: { getState: () => ({ reset: resetEventFormModal }) },
}));

vi.mock('@/shared/store/useTransactionModalStore', () => ({
  useTransactionModalStore: { getState: () => ({ reset: resetTransactionModal }) },
}));

vi.mock('@/shared/store/useToastStore', () => ({
  useToastStore: { getState: () => ({ reset: resetToast }) },
}));

vi.mock('@/shared/store/useDeletingStore', () => ({
  useDeletingStore: { getState: () => ({ reset: resetDeleting }) },
}));

function TestConsumer() {
  const ctx = use(AuthContext);
  if (!ctx) return <span>no-context</span>;
  return (
    <div>
      <span data-testid="user">{ctx.user ? ctx.user.email : 'null'}</span>
      <span data-testid="loading">{String(ctx.loading)}</span>
      <span data-testid="error">{ctx.error ? ctx.error.message : 'null'}</span>
      <button onClick={ctx.logout}>logout</button>
    </div>
  );
}

function renderProvider() {
  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>,
  );
}

function user(email = 'user@test.com') {
  return { id: '1', email, role: 'user' as const };
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    refreshAccessTokenMock.mockResolvedValue('my-jwt');
    logoutMock.mockResolvedValue(null);
  });

  it('sets loading to false without refreshing when no refresh token is stored', async () => {
    renderProvider();
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
    expect(refreshAccessTokenMock).not.toHaveBeenCalled();
    expect(getCurrentUserMock).not.toHaveBeenCalled();
  });

  it('bootstraps the session from the refresh token on mount', async () => {
    localStorage.setItem('refresh_token', 'stored-refresh');
    getCurrentUserMock.mockResolvedValueOnce(user());

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('user@test.com');
    });
    expect(refreshAccessTokenMock).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
  });

  it('sets loading to false without fetching user when the refresh fails', async () => {
    localStorage.setItem('refresh_token', 'stored-refresh');
    refreshAccessTokenMock.mockResolvedValue(null);

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
    expect(screen.getByTestId('user')).toHaveTextContent('null');
    expect(getCurrentUserMock).not.toHaveBeenCalled();
  });

  it('clears user and token when /auth/me returns 401', async () => {
    localStorage.setItem('refresh_token', 'stored-refresh');
    getCurrentUserMock.mockRejectedValueOnce(new ApiError(401, 'Unauthorized', 'Unauthorized'));

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
    expect(screen.getByTestId('user')).toHaveTextContent('null');
    expect(setAccessTokenMock).toHaveBeenCalledWith(null);
  });

  it('sets error when /auth/me returns non-401 server error', async () => {
    localStorage.setItem('refresh_token', 'stored-refresh');
    getCurrentUserMock.mockRejectedValueOnce(new ApiError(500, 'Internal Server Error', 'boom'));

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('auth_server_error_500');
    });
  });

  it('sets error on network failure during fetchUser', async () => {
    localStorage.setItem('refresh_token', 'stored-refresh');
    getCurrentUserMock.mockRejectedValueOnce(new ApiError(0, 'NetworkError', 'Failed to fetch'));

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('network_error');
    });
  });

  it('clears user, in-memory token and stored refresh token on logout', async () => {
    localStorage.setItem('refresh_token', 'stored-refresh');
    getCurrentUserMock.mockResolvedValueOnce(user());

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('user@test.com');
    });

    act(() => {
      screen.getByRole('button', { name: 'logout' }).click();
    });

    expect(screen.getByTestId('user')).toHaveTextContent('null');
    expect(setAccessTokenMock).toHaveBeenCalledWith(null);
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });

  it('revokes the refresh token server-side before wiping the local session', async () => {
    localStorage.setItem('refresh_token', 'stored-refresh');
    getCurrentUserMock.mockResolvedValueOnce(user());

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('user@test.com');
    });

    act(() => {
      screen.getByRole('button', { name: 'logout' }).click();
    });

    expect(logoutMock).toHaveBeenCalledWith('stored-refresh');
    // The request has to go out while the API client still holds the access
    // token, otherwise it leaves the server-side session alive.
    expect(logoutMock.mock.invocationCallOrder[0]).toBeLessThan(setAccessTokenMock.mock.invocationCallOrder[0]);
  });

  it('keeps the local logout immediate when the revocation request fails', async () => {
    localStorage.setItem('refresh_token', 'stored-refresh');
    getCurrentUserMock.mockResolvedValueOnce(user());
    logoutMock.mockRejectedValueOnce(new ApiError(401, 'Unauthorized', 'Unauthorized'));

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('user@test.com');
    });

    act(() => {
      screen.getByRole('button', { name: 'logout' }).click();
    });

    expect(screen.getByTestId('user')).toHaveTextContent('null');
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });

  it('resets all stores on logout', async () => {
    localStorage.setItem('refresh_token', 'stored-refresh');
    getCurrentUserMock.mockResolvedValueOnce(user());

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('user@test.com');
    });

    act(() => {
      screen.getByRole('button', { name: 'logout' }).click();
    });

    expect(resetEventFormModal).toHaveBeenCalled();
    expect(resetTransactionModal).toHaveBeenCalled();
    expect(resetToast).toHaveBeenCalled();
    expect(resetDeleting).toHaveBeenCalled();
  });

  it('calls logout when auth:logout event is dispatched', async () => {
    localStorage.setItem('refresh_token', 'stored-refresh');
    getCurrentUserMock.mockResolvedValueOnce(user());

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('user@test.com');
    });

    act(() => {
      window.dispatchEvent(new Event('auth:logout'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('null');
    });
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });
});
