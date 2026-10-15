import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { User } from '@/features/auth/types';

import { AdminUserActions } from './AdminUserActions';

const mockUser: User = {
  id: 'u-1',
  email: 'user@test.com',
  role: 'user',
};

const renderActions = (props: { mobile?: boolean; disabled?: boolean } = {}) => {
  const handlers = { onInvite: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn() };
  const view = render(
    <AdminUserActions
      user={mockUser}
      disabled={props.disabled ?? false}
      mobile={props.mobile}
      inviteLabel="Invite"
      editLabel="Edit"
      deleteLabel="Delete"
      {...handlers}
    />,
  );
  return { ...view, ...handlers };
};

describe('AdminUserActions', () => {
  it('calls onInvite, onEdit and onDelete with correct payload in desktop mode', () => {
    const { onInvite, onEdit, onDelete } = renderActions();

    fireEvent.click(screen.getByRole('button', { name: 'Invite' }));
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(onInvite).toHaveBeenCalledTimes(1);
    expect(onInvite).toHaveBeenCalledWith(mockUser);
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(mockUser);
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith('u-1');
  });

  it('renders mobile layout and disables edit and delete when disabled', () => {
    const { container, onEdit, onDelete } = renderActions({ mobile: true, disabled: true });

    expect(container.firstElementChild).toHaveClass('grid', 'grid-cols-3');

    const editButton = screen.getByRole('button', { name: 'Edit' });
    const deleteButton = screen.getByRole('button', { name: 'Delete' });

    expect(editButton).toBeDisabled();
    expect(deleteButton).toBeDisabled();

    fireEvent.click(editButton);
    fireEvent.click(deleteButton);

    expect(onEdit).not.toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
  });

  // Inviting only shares text, so a mutation in flight elsewhere on the page must not block it.
  it.each([false, true])('keeps invite enabled while disabled (mobile: %s)', (mobile) => {
    const { onInvite } = renderActions({ mobile, disabled: true });

    const inviteButton = screen.getByRole('button', { name: 'Invite' });
    expect(inviteButton).toBeEnabled();

    fireEvent.click(inviteButton);
    expect(onInvite).toHaveBeenCalledWith(mockUser);
  });
});
