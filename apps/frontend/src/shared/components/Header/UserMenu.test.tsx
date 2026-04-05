import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserMenu } from './UserMenu';
import { useAuth } from '@/features/auth/useAuth';

const navigateMock = vi.fn();
const successMock = vi.fn();

vi.mock('@/features/auth/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/shared/hooks/useToast', () => ({
  useToast: () => ({
    success: successMock,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe('UserMenu', () => {
  const mockedUseAuth = vi.mocked(useAuth);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows admin menu entry for admin users', async () => {
    mockedUseAuth.mockReturnValue({
      user: {
        id: 'admin-1',
        email: 'admin@test.com',
        name: 'Admin',
        role: 'admin',
      },
      loading: false,
      logout: vi.fn(),
      token: 'token',
      error: null,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      loginWithMicrosoft: vi.fn(),
      setAuth: vi.fn(),
      refreshUser: vi.fn(),
      updateUser: vi.fn(),
    });

    render(<UserMenu />);

    const trigger = screen.getByRole('button');
    fireEvent.pointerDown(trigger);

    expect(await screen.findByText(/users administration|user management/i)).toBeInTheDocument();
  });

  it('navigates to profile page when clicking profile menu entry', async () => {
    mockedUseAuth.mockReturnValue({
      user: {
        id: 'user-1',
        email: 'user@test.com',
        name: 'User',
        role: 'user',
      },
      loading: false,
      logout: vi.fn(),
      token: 'token',
      error: null,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      loginWithMicrosoft: vi.fn(),
      setAuth: vi.fn(),
      refreshUser: vi.fn(),
      updateUser: vi.fn(),
    });

    render(<UserMenu />);

    const trigger = screen.getByRole('button');
    fireEvent.pointerDown(trigger);

    const profileMenuItem = await screen.findByText(/profile|perfil/i);
    fireEvent.click(profileMenuItem);

    expect(navigateMock).toHaveBeenCalledWith('/profile');
  });

  it('does not show admin menu entry for non-admin users', async () => {
    mockedUseAuth.mockReturnValue({
      user: {
        id: 'user-1',
        email: 'user@test.com',
        name: 'User',
        role: 'user',
      },
      loading: false,
      logout: vi.fn(),
      token: 'token',
      error: null,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      loginWithMicrosoft: vi.fn(),
      setAuth: vi.fn(),
      refreshUser: vi.fn(),
      updateUser: vi.fn(),
    });

    render(<UserMenu />);

    const trigger = screen.getByRole('button');
    fireEvent.pointerDown(trigger);

    await waitFor(() => {
      expect(screen.queryByText(/users administration|user management/i)).not.toBeInTheDocument();
    });
  });

  it('navigates to admin users page when clicking admin menu entry', async () => {
    mockedUseAuth.mockReturnValue({
      user: {
        id: 'admin-1',
        email: 'admin@test.com',
        name: 'Admin',
        role: 'admin',
      },
      loading: false,
      logout: vi.fn(),
      token: 'token',
      error: null,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      loginWithMicrosoft: vi.fn(),
      setAuth: vi.fn(),
      refreshUser: vi.fn(),
      updateUser: vi.fn(),
    });

    render(<UserMenu />);

    const trigger = screen.getByRole('button');
    fireEvent.pointerDown(trigger);

    const menuItem = await screen.findByText(/users administration|user management/i);
    fireEvent.click(menuItem);

    expect(navigateMock).toHaveBeenCalledWith('/admin/users');
  });

  it('renders nothing while auth is loading', () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      loading: true,
      logout: vi.fn(),
      token: null,
      error: null,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      loginWithMicrosoft: vi.fn(),
      setAuth: vi.fn(),
      refreshUser: vi.fn(),
      updateUser: vi.fn(),
    });

    const { container } = render(<UserMenu />);

    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when there is no authenticated user', () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      loading: false,
      logout: vi.fn(),
      token: null,
      error: null,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      loginWithMicrosoft: vi.fn(),
      setAuth: vi.fn(),
      refreshUser: vi.fn(),
      updateUser: vi.fn(),
    });

    const { container } = render(<UserMenu />);

    expect(container.firstChild).toBeNull();
  });
});
