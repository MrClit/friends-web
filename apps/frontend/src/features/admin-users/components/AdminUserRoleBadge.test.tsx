import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AdminUserRoleBadge } from './AdminUserRoleBadge';

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next');

  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, options?: { defaultValue?: string }) => {
        const translations: Record<string, string> = {
          'roles.admin.label': 'ADMIN',
          'roles.admin.description': 'Can manage users and permissions',
          'roles.user.label': 'USER',
          'roles.user.description': 'Basic access to the application',
        };

        return translations[key] ?? options?.defaultValue ?? key;
      },
    }),
  };
});

describe('AdminUserRoleBadge', () => {
  it('renders admin role with purple semantic styles', () => {
    render(<AdminUserRoleBadge role="admin" />);

    const badge = screen.getByText('ADMIN');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('border-purple-300');
    expect(badge.className).toContain('text-purple-700');
    expect(badge).toHaveAttribute('title', 'Can manage users and permissions');
  });

  it('renders user role with blue semantic styles', () => {
    render(<AdminUserRoleBadge role="user" />);

    const badge = screen.getByText('USER');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('border-blue-300');
    expect(badge.className).toContain('text-blue-700');
    expect(badge).toHaveAttribute('title', 'Basic access to the application');
  });
});
