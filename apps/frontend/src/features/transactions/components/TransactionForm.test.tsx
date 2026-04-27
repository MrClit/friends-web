import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { TransactionForm } from './TransactionForm';
import type { TransactionFormState } from './TransactionForm';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

vi.mock('./TransactionParticipantCombobox', () => ({
  TransactionParticipantCombobox: () => <div data-testid="participant-combobox" />,
}));

function makeFields(overrides: Partial<TransactionFormState> = {}): TransactionFormState {
  return {
    type: 'expense',
    title: '',
    setTitle: vi.fn(),
    amount: '',
    setAmount: vi.fn(),
    date: '',
    setDate: vi.fn(),
    participantId: '',
    setParticipantId: vi.fn(),
    ...overrides,
  };
}

const originalUserAgent = navigator.userAgent;

afterEach(() => {
  Object.defineProperty(navigator, 'userAgent', {
    value: originalUserAgent,
    configurable: true,
  });
});

describe('TransactionForm', () => {
  it('renders all form inputs and the participant combobox', () => {
    render(<TransactionForm fields={makeFields()} participants={[]} onSubmit={vi.fn()} />);
    expect(screen.getByLabelText('transactionForm.titleLabel')).toBeInTheDocument();
    expect(screen.getByLabelText('transactionForm.amountLabel')).toBeInTheDocument();
    expect(screen.getByLabelText('transactionForm.dateLabel')).toBeInTheDocument();
    expect(screen.getByTestId('participant-combobox')).toBeInTheDocument();
  });

  it('amount input has type=number, min=0.01 and step=0.01', () => {
    render(<TransactionForm fields={makeFields()} participants={[]} onSubmit={vi.fn()} />);
    const amountInput = screen.getByLabelText('transactionForm.amountLabel');
    expect(amountInput).toHaveAttribute('type', 'number');
    expect(amountInput).toHaveAttribute('min', '0.01');
    expect(amountInput).toHaveAttribute('step', '0.01');
  });

  it('renders initial values from fields prop', () => {
    const fields = makeFields({ title: 'Dinner', amount: '25.50', date: '2026-01-15' });
    render(<TransactionForm fields={fields} participants={[]} onSubmit={vi.fn()} />);
    expect(screen.getByLabelText('transactionForm.titleLabel')).toHaveValue('Dinner');
    expect(screen.getByLabelText('transactionForm.amountLabel')).toHaveValue(25.5);
    expect(screen.getByLabelText('transactionForm.dateLabel')).toHaveValue('2026-01-15');
  });

  it('calls setTitle when title input changes', () => {
    const setTitle = vi.fn();
    render(<TransactionForm fields={makeFields({ setTitle })} participants={[]} onSubmit={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('transactionForm.titleLabel'), {
      target: { value: 'New title' },
    });
    expect(setTitle).toHaveBeenCalledWith('New title');
  });

  it('calls setAmount when amount input changes', () => {
    const setAmount = vi.fn();
    render(<TransactionForm fields={makeFields({ setAmount })} participants={[]} onSubmit={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('transactionForm.amountLabel'), {
      target: { value: '10.99' },
    });
    expect(setAmount).toHaveBeenCalledWith('10.99');
  });

  it('calls setDate when date input changes', () => {
    const setDate = vi.fn();
    render(<TransactionForm fields={makeFields({ setDate })} participants={[]} onSubmit={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('transactionForm.dateLabel'), {
      target: { value: '2026-04-27' },
    });
    expect(setDate).toHaveBeenCalledWith('2026-04-27');
  });

  it('does not show iOS calendar icon on non-iOS browsers', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      configurable: true,
    });
    const { container } = render(<TransactionForm fields={makeFields()} participants={[]} onSubmit={vi.fn()} />);
    const dateInput = screen.getByLabelText('transactionForm.dateLabel');
    expect(dateInput.className).not.toContain('ios-date-input-force-custom');
    expect(container.querySelector('svg')).toBeNull();
  });

  it('shows iOS calendar icon on iOS Safari', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      configurable: true,
    });
    Object.defineProperty(navigator, 'maxTouchPoints', { value: 5, configurable: true });

    const { container } = render(<TransactionForm fields={makeFields()} participants={[]} onSubmit={vi.fn()} />);
    const dateInput = screen.getByLabelText('transactionForm.dateLabel');
    expect(dateInput.className).toContain('ios-date-input-force-custom');
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
