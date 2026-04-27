import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useContext } from 'react';
import { AuthProvider, AuthContext } from './AuthContext';

const resetEventFormModal = vi.fn();
const resetTransactionModal = vi.fn();
const resetToast = vi.fn();
const resetDeleting = vi.fn();

vi.mock('@/api/client', () => ({
  REFRESH_TOKEN_KEY: 'refresh_token',
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
  const ctx = useContext(AuthContext);
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

function userResponse(email = 'user@test.com') {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve({ data: { id: '1', email, role: 'user' } }),
  } as unknown as Response;
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    vi.clearAllMocks();
  });

  it('sets loading to false when no token is stored', async () => {
    renderProvider();
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('fetches user on mount when token is stored', async () => {
    localStorage.setItem('token', 'my-jwt');
    vi.mocked(fetch).mockResolvedValueOnce(userResponse());

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('user@test.com');
    });
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
  });

  it('clears user and token when /auth/me returns 401', async () => {
    localStorage.setItem('token', 'expired-jwt');
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 401 } as Response);

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
    expect(screen.getByTestId('user')).toHaveTextContent('null');
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('sets error when /auth/me returns non-401 server error', async () => {
    localStorage.setItem('token', 'my-jwt');
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 500 } as Response);

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('auth_server_error_500');
    });
  });

  it('sets error on network failure during fetchUser', async () => {
    localStorage.setItem('token', 'my-jwt');
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network down'));

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Network down');
    });
  });

  it('clears user, token and localStorage on logout', async () => {
    localStorage.setItem('token', 'my-jwt');
    vi.mocked(fetch).mockResolvedValueOnce(userResponse());

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('user@test.com');
    });

    act(() => {
      screen.getByRole('button', { name: 'logout' }).click();
    });

    expect(screen.getByTestId('user')).toHaveTextContent('null');
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('resets all stores on logout', async () => {
    localStorage.setItem('token', 'my-jwt');
    vi.mocked(fetch).mockResolvedValueOnce(userResponse());

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
    localStorage.setItem('token', 'my-jwt');
    vi.mocked(fetch).mockResolvedValueOnce(userResponse());

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
    expect(localStorage.getItem('token')).toBeNull();
  });
});
