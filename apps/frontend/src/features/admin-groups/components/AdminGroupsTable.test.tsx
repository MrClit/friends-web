import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import type { AdminGroup } from '@/api/admin-groups.api';

import { AdminGroupsTable } from './AdminGroupsTable';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

const group: AdminGroup = { id: 'group-1', name: 'Amigos', memberCount: 3, createdAt: '', updatedAt: '' };

describe('AdminGroupsTable', () => {
  it('links each group to its detail page', () => {
    render(
      <MemoryRouter>
        <AdminGroupsTable groups={[group]} onRename={vi.fn()} onDelete={vi.fn()} />
      </MemoryRouter>,
    );

    // One link for the mobile cards and one for the desktop table.
    for (const link of screen.getAllByRole('link', { name: 'Amigos' })) {
      expect(link).toHaveAttribute('href', '/admin/groups/group-1');
    }
  });

  it('hands the group to the rename and delete actions', () => {
    const onRename = vi.fn();
    const onDelete = vi.fn();
    render(
      <MemoryRouter>
        <AdminGroupsTable groups={[group]} onRename={onRename} onDelete={onDelete} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getAllByRole('button', { name: 'rename' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'delete' })[0]);

    expect(onRename).toHaveBeenCalledWith(group);
    expect(onDelete).toHaveBeenCalledWith(group);
  });
});
