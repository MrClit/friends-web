import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { User } from '@/features/auth/types';

import { AdminGroupMemberPicker } from './AdminGroupMemberPicker';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

const users: User[] = [
  { id: 'ana', name: 'Ana', email: 'ana@test.com', role: 'user' },
  { id: 'luis', name: 'Luis', email: 'luis@test.com', role: 'user' },
  { id: 'marta', name: 'Marta', email: 'mgarcia@test.com', role: 'user' },
];

function openPicker(onAdd = vi.fn(), memberIds: ReadonlySet<string> = new Set(['ana'])) {
  render(<AdminGroupMemberPicker users={users} memberIds={memberIds} onAdd={onAdd} />);
  fireEvent.click(screen.getByRole('button', { name: 'detail.addLabel' }));
  return onAdd;
}

describe('AdminGroupMemberPicker', () => {
  it('offers only the users who are not members yet', () => {
    openPicker();

    expect(screen.queryByText('Ana')).not.toBeInTheDocument();
    expect(screen.getByText('Luis')).toBeInTheDocument();
    expect(screen.getByText('Marta')).toBeInTheDocument();
  });

  it('filters by name and by email', () => {
    openPicker();
    const search = screen.getByLabelText('detail.searchPlaceholder');

    fireEvent.change(search, { target: { value: 'lu' } });
    expect(screen.getByText('Luis')).toBeInTheDocument();
    expect(screen.queryByText('Marta')).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: 'mgarcia' } });
    expect(screen.getByText('Marta')).toBeInTheDocument();
    expect(screen.queryByText('Luis')).not.toBeInTheDocument();
  });

  it('adds the picked user', () => {
    const onAdd = openPicker();

    fireEvent.click(screen.getByText('Luis'));

    expect(onAdd).toHaveBeenCalledWith('luis');
  });

  it('says so when everyone is already a member', () => {
    openPicker(vi.fn(), new Set(users.map((user) => user.id)));

    expect(screen.getByText('detail.noUsersFound')).toBeInTheDocument();
  });
});
