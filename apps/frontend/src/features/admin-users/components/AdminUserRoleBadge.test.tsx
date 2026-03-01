import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AdminUserRoleBadge } from './AdminUserRoleBadge';

describe('AdminUserRoleBadge', () => {
  it('renders admin role with purple semantic styles', () => {
    render(<AdminUserRoleBadge role="admin" />);

    const badge = screen.getByText('admin');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('border-purple-300');
    expect(badge.className).toContain('text-purple-700');
  });

  it('renders user role with blue semantic styles', () => {
    render(<AdminUserRoleBadge role="user" />);

    const badge = screen.getByText('user');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('border-blue-300');
    expect(badge.className).toContain('text-blue-700');
  });
});
