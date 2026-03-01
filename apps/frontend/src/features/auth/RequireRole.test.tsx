import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { RequireRole } from './RequireRole';
import { useAccessGuard } from './useAccessGuard';

const addToastMock = vi.fn();

vi.mock('./useAccessGuard', () => ({
  useAccessGuard: vi.fn(),
}));

vi.mock('@/shared/store/useToastStore', () => ({
  useToastStore: () => ({
    addToast: addToastMock,
  }),
}));

function renderGuardedView() {
  return render(
    <MemoryRouter initialEntries={['/admin/users']}>
      <Routes>
        <Route
          path="/admin/users"
          element={
            <RequireRole allowedRoles={['admin']}>
              <div>admin-content</div>
            </RequireRole>
          }
        />
        <Route path="/" element={<div>home-content</div>} />
        <Route path="/login" element={<div>login-content</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RequireRole', () => {
  const mockedUseAccessGuard = vi.mocked(useAccessGuard);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when access is authorized', () => {
    mockedUseAccessGuard.mockReturnValue({
      location: { pathname: '/admin/users' } as never,
      status: 'authorized',
      user: { id: '1', email: 'admin@test.com', role: 'admin' } as never,
      error: null,
      isAllowed: true,
    });

    renderGuardedView();

    expect(screen.getByText('admin-content')).toBeInTheDocument();
  });

  it('redirects to login when unauthenticated', () => {
    mockedUseAccessGuard.mockReturnValue({
      location: { pathname: '/admin/users' } as never,
      status: 'unauthenticated',
      user: null,
      error: null,
      isAllowed: false,
    });

    renderGuardedView();

    expect(screen.getByText('login-content')).toBeInTheDocument();
    expect(addToastMock).not.toHaveBeenCalled();
  });

  it('redirects to home and shows toast when unauthorized', async () => {
    mockedUseAccessGuard.mockReturnValue({
      location: { pathname: '/admin/users' } as never,
      status: 'unauthorized',
      user: { id: '2', email: 'user@test.com', role: 'user' } as never,
      error: null,
      isAllowed: false,
    });

    renderGuardedView();

    expect(screen.getByText('home-content')).toBeInTheDocument();

    await waitFor(() => {
      expect(addToastMock).toHaveBeenCalledTimes(1);
      expect(addToastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
        }),
      );
    });
  });
});
