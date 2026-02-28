import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TransactionTypeSelector } from './TransactionTypeSelector';

vi.mock('@/shared/utils', () => ({
  cn: (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' '),
}));

vi.mock('../constants', () => {
  const MockIcon = ({ className }: { className?: string }) => <svg data-testid="mock-icon" className={className} />;

  return {
    PAYMENT_TYPES: ['contribution', 'expense', 'compensation'],
    PAYMENT_TYPE_CONFIG: {
      contribution: { IconComponent: MockIcon },
      expense: { IconComponent: MockIcon },
      compensation: { IconComponent: MockIcon },
    },
  };
});

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next');

  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => {
        const translations: Record<string, string> = {
          'transactionTypeSelector.contribution': 'Contribution',
          'transactionTypeSelector.expense': 'Expense',
          'transactionTypeSelector.compensation': 'Compensation',
        };
        return translations[key] ?? key;
      },
    }),
  };
});

describe('TransactionTypeSelector', () => {
  it('renders all payment type options', () => {
    render(<TransactionTypeSelector value="expense" onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: /Contribution/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Expense/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Compensation/i })).toBeInTheDocument();
  });

  it('applies active styles only to selected type', () => {
    render(<TransactionTypeSelector value="expense" onChange={vi.fn()} />);

    const contributionButton = screen.getByRole('button', { name: /Contribution/i });
    const expenseButton = screen.getByRole('button', { name: /Expense/i });
    const compensationButton = screen.getByRole('button', { name: /Compensation/i });

    expect(expenseButton.className).toContain('bg-emerald-500');
    expect(contributionButton.className).not.toContain('bg-emerald-500');
    expect(compensationButton.className).not.toContain('bg-emerald-500');
  });

  it('calls onChange with the corresponding payment type when each option is clicked', () => {
    const onChange = vi.fn();

    render(<TransactionTypeSelector value="contribution" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /Contribution/i }));
    fireEvent.click(screen.getByRole('button', { name: /Expense/i }));
    fireEvent.click(screen.getByRole('button', { name: /Compensation/i }));

    expect(onChange).toHaveBeenNthCalledWith(1, 'contribution');
    expect(onChange).toHaveBeenNthCalledWith(2, 'expense');
    expect(onChange).toHaveBeenNthCalledWith(3, 'compensation');
  });

  it('hides label on inactive options and keeps active label always visible', () => {
    render(<TransactionTypeSelector value="contribution" onChange={vi.fn()} />);

    const contributionLabel = screen.getByText('Contribution');
    const expenseLabel = screen.getByText('Expense');

    expect(contributionLabel.className).not.toContain('hidden sm:inline');
    expect(expenseLabel.className).toContain('hidden sm:inline');
  });
});
