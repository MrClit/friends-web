import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Group } from '@/api/groups.api';
import { EventGroupField } from './EventGroupField';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { names?: string }) => (options?.names ? `${key}: ${options.names}` : key),
  }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

const groups: Group[] = [
  { id: 'group-1', name: 'Friends' },
  { id: 'group-2', name: 'Work' },
];

const renderField = (props: Partial<React.ComponentProps<typeof EventGroupField>> = {}) =>
  render(<EventGroupField groups={groups} groupId="" canChange onChange={vi.fn()} removedNames={[]} {...props} />);

describe('EventGroupField', () => {
  it('lets the user pick among several groups', () => {
    const onChange = vi.fn();
    renderField({ onChange });

    fireEvent.change(screen.getByRole('combobox', { name: 'eventForm.groupLabel' }), {
      target: { value: 'group-2' },
    });

    expect(onChange).toHaveBeenCalledWith('group-2');
  });

  it('shows a single group as already chosen, with nothing to pick', () => {
    renderField({ groups: [groups[0]], groupId: 'group-1' });

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('Friends')).toHaveAttribute('readonly');
  });

  it('shows the group read-only to a normal user editing an event', () => {
    renderField({ groups: [], groupId: 'group-9', groupName: 'Old crew', canChange: false });

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('Old crew')).toHaveAttribute('readonly');
    expect(screen.getByText('eventForm.groupReadOnlyHint')).toBeInTheDocument();
  });

  it('warns about the users a group change removed', () => {
    renderField({ groupId: 'group-2', removedNames: ['Bob', 'Carol'] });

    expect(screen.getByRole('status')).toHaveTextContent('eventForm.removedByGroupChange: Bob, Carol');
  });
});
