import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { User } from '@/features/auth/types';

import { AdminUserActions } from './AdminUserActions';

const mockUser: User = {
  id: 'u-1',
  email: 'user@test.com',
  role: 'user',
};

describe('AdminUserActions', () => {
  it('calls onEdit and onDelete with correct payload in desktop mode', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <AdminUserActions
        user={mockUser}
        disabled={false}
        editLabel="Edit"
        deleteLabel="Delete"
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(mockUser);
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith('u-1');
  });

  it('renders mobile layout and disables both actions when disabled', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    const { container } = render(
      <AdminUserActions
        user={mockUser}
        mobile
        disabled
        editLabel="Edit"
        deleteLabel="Delete"
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    expect(container.firstElementChild).toHaveClass('grid', 'grid-cols-2');

    const editButton = screen.getByRole('button', { name: 'Edit' });
    const deleteButton = screen.getByRole('button', { name: 'Delete' });

    expect(editButton).toBeDisabled();
    expect(deleteButton).toBeDisabled();

    fireEvent.click(editButton);
    fireEvent.click(deleteButton);

    expect(onEdit).not.toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
  });
});
