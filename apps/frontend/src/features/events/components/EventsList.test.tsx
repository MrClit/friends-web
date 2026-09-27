import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventsList } from './EventsList';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

vi.mock('@/hooks/api/useEvents', () => ({
  useEvents: () => ({ data: [], isLoading: false, error: null, refetch: vi.fn() }),
}));

const groupsQuery = { data: [] as { id: string; name: string }[], isSuccess: true };
vi.mock('@/hooks/api/useGroups', () => ({
  useGroups: () => groupsQuery,
}));

const auth = { user: { id: 'u1', role: 'user' } };
vi.mock('@/features/auth/useAuth', () => ({
  useAuth: () => auth,
}));

const renderList = () =>
  render(
    <MemoryRouter>
      <EventsList />
    </MemoryRouter>,
  );

describe('EventsList create card', () => {
  beforeEach(() => {
    groupsQuery.data = [];
    auth.user.role = 'user';
  });

  it('is disabled and explains why for a user without a group', () => {
    renderList();

    expect(screen.getByRole('button', { name: 'createEventCard.ariaLabel' })).toBeDisabled();
    expect(screen.getByText('createEventCard.noGroupSubtitle')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('points the admin to the group administration when no group exists', () => {
    auth.user.role = 'admin';
    renderList();

    expect(screen.getByText('createEventCard.noGroupAdminSubtitle')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'createEventCard.goToGroups' })).toHaveAttribute('href', '/admin/groups');
  });

  it('is enabled for a user with a group', () => {
    groupsQuery.data = [{ id: 'group-1', name: 'Friends' }];
    renderList();

    expect(screen.getByRole('button', { name: 'createEventCard.ariaLabel' })).toBeEnabled();
    expect(screen.getByText('createEventCard.subtitle')).toBeInTheDocument();
  });
});
