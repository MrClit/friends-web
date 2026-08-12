import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ParticipantRow } from './ParticipantRow';
import type { EventParticipant } from '../types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

vi.mock('@/i18n', () => ({
  getCurrentLocale: () => 'es-ES',
}));

vi.mock('./ParticipantsCombobox', () => ({
  ParticipantsCombobox: () => <div data-testid="participants-combobox" />,
}));

const guest: EventParticipant = { type: 'guest', id: 'g1', name: 'Ana' };

type ParticipantRowProps = Parameters<typeof ParticipantRow>[0];

function makeProps(overrides: Partial<ParticipantRowProps> = {}): ParticipantRowProps {
  return {
    participant: guest,
    participantIndex: 1,
    isFirst: false,
    existingParticipants: [guest],
    isRenamingGuest: false,
    isReplacingGuest: false,
    renamingGuestName: '',
    replaceInputValue: '',
    onDelete: vi.fn(),
    onStartReplace: vi.fn(),
    onCancelReplace: vi.fn(),
    onReplaceWithUser: vi.fn(),
    onReplaceInputChange: vi.fn(),
    onStartRename: vi.fn(),
    onCancelRename: vi.fn(),
    onRenameNameChange: vi.fn(),
    onCommitRename: vi.fn(),
    onTargetChange: vi.fn(),
    ...overrides,
  };
}

function getTargetInput() {
  return screen.getByLabelText('participantsInput.targetAria');
}

describe('ParticipantRow contribution target', () => {
  // type=number is deliberately avoided: Safari on iOS reports an empty value for a half-typed
  // decimal, which silently dropped what the user typed. See sanitizeAmountInput.
  it('is a text field with a decimal keyboard', () => {
    render(<ParticipantRow {...makeProps()} />);
    expect(getTargetInput()).toHaveAttribute('type', 'text');
    expect(getTargetInput()).toHaveAttribute('inputmode', 'decimal');
  });

  it('shows an empty field when there is no target', () => {
    render(<ParticipantRow {...makeProps()} />);
    expect(getTargetInput()).toHaveValue('');
  });

  it('shows the existing target', () => {
    render(<ParticipantRow {...makeProps({ participant: { ...guest, contributionTarget: 25.5 } })} />);
    expect(getTargetInput()).toHaveValue('25.5');
  });

  it('normalizes a comma typed as decimal separator', () => {
    const onTargetChange = vi.fn();
    render(<ParticipantRow {...makeProps({ onTargetChange })} />);

    fireEvent.change(getTargetInput(), { target: { value: '10,99' } });

    expect(onTargetChange).toHaveBeenCalledWith(10.99);
    expect(getTargetInput()).toHaveValue('10.99');
  });

  it('keeps a half-typed decimal visible while the parent only sees the integer', () => {
    const onTargetChange = vi.fn();
    render(<ParticipantRow {...makeProps({ onTargetChange })} />);

    fireEvent.change(getTargetInput(), { target: { value: '10,' } });

    expect(onTargetChange).toHaveBeenCalledWith(10);
    expect(getTargetInput()).toHaveValue('10.');
  });

  it('clears the target when the field is emptied', () => {
    const onTargetChange = vi.fn();
    render(<ParticipantRow {...makeProps({ participant: { ...guest, contributionTarget: 20 }, onTargetChange })} />);

    fireEvent.change(getTargetInput(), { target: { value: '' } });

    expect(onTargetChange).toHaveBeenCalledWith(undefined);
    expect(getTargetInput()).toHaveValue('');
  });

  it('resyncs the field when the target changes from outside', () => {
    const { rerender } = render(
      <ParticipantRow {...makeProps({ participant: { ...guest, contributionTarget: 20 } })} />,
    );
    expect(getTargetInput()).toHaveValue('20');

    rerender(<ParticipantRow {...makeProps({ participant: { ...guest, contributionTarget: 30 } })} />);

    expect(getTargetInput()).toHaveValue('30');
  });

  it('does not render the target field for the pot participant', () => {
    render(<ParticipantRow {...makeProps({ participant: { type: 'pot', id: '0' } })} />);
    expect(screen.queryByLabelText('participantsInput.targetAria')).not.toBeInTheDocument();
  });
});
