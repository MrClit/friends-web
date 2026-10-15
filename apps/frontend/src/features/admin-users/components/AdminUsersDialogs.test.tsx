import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { User } from '@/features/auth/types';

import { AdminUsersDialogs } from './AdminUsersDialogs';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: { email?: string }) => (values?.email ? `${key} ${values.email}` : key),
  }),
}));

// Render only what the create dialog decides: its title, body and primary action.
vi.mock('@/shared/components/DialogFormWrapper', () => ({
  DialogFormWrapper: ({
    open,
    title,
    children,
    primaryAction,
  }: {
    open: boolean;
    title: React.ReactNode;
    children: React.ReactNode;
    primaryAction: { label: string; onClick: () => void };
  }) =>
    open ? (
      <section>
        <h2>{title}</h2>
        {children}
        <button type="button" onClick={primaryAction.onClick}>
          {primaryAction.label}
        </button>
      </section>
    ) : null,
}));

vi.mock('@/shared/components/ConfirmDialog', () => ({ ConfirmDialog: () => null }));

vi.mock('./AdminUserForm', () => ({ AdminUserForm: () => <form aria-label="create form" /> }));

const CREATED_USER: User = { id: 'created-1', email: 'new@test.com', role: 'user' };

const renderCreateDialog = (createdUser: User | null) => {
  const handlers = { onShareInvitation: vi.fn(), onCreateSubmit: vi.fn().mockResolvedValue(undefined) };
  render(
    <AdminUsersDialogs
      isCreateOpen
      createForm={{ email: '', role: 'user' }}
      isCreating={false}
      createdUser={createdUser}
      onShareInvitation={handlers.onShareInvitation}
      onCreateOpenChange={vi.fn()}
      onCreateFormChange={vi.fn()}
      onCreateSubmit={handlers.onCreateSubmit}
      isEditOpen={false}
      editForm={{ email: '', name: '', avatar: '', role: 'user' }}
      isUpdating={false}
      onEditOpenChange={vi.fn()}
      onEditFormChange={vi.fn()}
      onEditSubmit={vi.fn()}
      isDeleteOpen={false}
      isDeleting={false}
      onDeleteOpenChange={vi.fn()}
      onDeleteConfirm={vi.fn()}
    />,
  );
  return handlers;
};

describe('AdminUsersDialogs — create dialog', () => {
  it('shows the create form until a user has been created', () => {
    const { onCreateSubmit } = renderCreateDialog(null);

    expect(screen.getByRole('heading', { name: 'createTitle' })).toBeInTheDocument();
    expect(screen.getByRole('form', { name: 'create form' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'createAction' }));
    expect(onCreateSubmit).toHaveBeenCalledTimes(1);
  });

  it('switches to the "user created" step and shares the invitation for that user', () => {
    const { onShareInvitation, onCreateSubmit } = renderCreateDialog(CREATED_USER);

    expect(screen.getByRole('heading', { name: 'invitation.createdTitle' })).toBeInTheDocument();
    expect(screen.getByText('invitation.createdMessage new@test.com')).toBeInTheDocument();
    expect(screen.queryByRole('form', { name: 'create form' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'invitation.share' }));

    expect(onShareInvitation).toHaveBeenCalledWith('new@test.com');
    expect(onCreateSubmit).not.toHaveBeenCalled();
  });
});
