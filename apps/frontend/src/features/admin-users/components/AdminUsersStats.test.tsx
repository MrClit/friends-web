import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { User } from '@/features/auth/types';

import { AdminUsersStats } from './AdminUsersStats';

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next');

  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => {
        const translations: Record<string, string> = {
          'adminUsers.stats.totalShort': 'Tot',
          'adminUsers.stats.adminShort': 'Adm',
          'adminUsers.stats.userShort': 'Usr',
          'adminUsers.stats.total': 'Total users',
          'adminUsers.stats.admin': 'Admins',
          'adminUsers.stats.user': 'Users',
        };

        return translations[key] ?? key;
      },
    }),
  };
});

describe('AdminUsersStats', () => {
  it('renders short and full labels for mobile and desktop blocks', () => {
    render(<AdminUsersStats users={[]} />);

    expect(screen.getByText('Tot')).toBeInTheDocument();
    expect(screen.getByText('Adm')).toBeInTheDocument();
    expect(screen.getByText('Usr')).toBeInTheDocument();

    expect(screen.getByText('Total users')).toBeInTheDocument();
    expect(screen.getByText('Admins')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
  });

  it('shows total, admin, and user counters in both responsive variants', () => {
    const users: User[] = [
      { id: '1', email: 'admin1@test.com', role: 'admin' },
      { id: '2', email: 'admin2@test.com', role: 'admin' },
      { id: '3', email: 'user1@test.com', role: 'user' },
      { id: '4', email: 'user2@test.com', role: 'user' },
      { id: '5', email: 'user3@test.com', role: 'user' },
    ];

    render(<AdminUsersStats users={users} />);

    expect(screen.getAllByText('5')).toHaveLength(2);
    expect(screen.getAllByText('2')).toHaveLength(2);
    expect(screen.getAllByText('3')).toHaveLength(2);
  });
});
