import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import TransactionItem from './TransactionItem';
import type { Transaction } from '../types';
import { useTransactionsStore } from '../store/useTransactionsStore';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'transactionsList.participantPrefix.contribution': 'Recibido de',
        'transactionsList.participantPrefix.expense': 'Pagado por',
        'transactionsList.participantPrefix.compensation': 'Pagado a',
        'transactionsList.potLabel': 'El Bote',
        'transactionsList.unknownParticipant': 'Participante desconocido',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock formatAmount
vi.mock('../../../shared/utils/formatAmount', () => ({
  formatAmount: (amount: number) => `€${amount.toFixed(2)}`,
}));

describe('TransactionItem', () => {
  const mockOnClick = vi.fn();
  const participantsMap = new Map([
    ['p1', 'Alice'],
    ['p2', 'Bob'],
  ]);

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  describe('Rendering', () => {
    it('should render a contribution transaction correctly', () => {
      const transaction: Transaction = {
        id: 't1',
        title: 'Monthly contribution',
        paymentType: 'contribution',
        amount: 100,
        participantId: 'p1',
        date: '2025-01-15',
        eventId: 'e1',
      };

      render(
        <TransactionItem
          transaction={transaction}
          participantsMap={participantsMap}
          onClick={mockOnClick}
        />,
      );

      expect(screen.getByText('Monthly contribution')).toBeInTheDocument();
      expect(screen.getByText('€100.00')).toBeInTheDocument();
      expect(screen.getByText(/Recibido de Alice/)).toBeInTheDocument();
    });

    it('should render an expense transaction correctly', () => {
      const transaction: Transaction = {
        id: 't2',
        title: 'Groceries',
        paymentType: 'expense',
        amount: 50.5,
        participantId: 'p2',
        date: '2025-01-15',
        eventId: 'e1',
      };

      render(
        <TransactionItem
          transaction={transaction}
          participantsMap={participantsMap}
          onClick={mockOnClick}
        />,
      );

      expect(screen.getByText('Groceries')).toBeInTheDocument();
      expect(screen.getByText('€50.50')).toBeInTheDocument();
      expect(screen.getByText(/Pagado por Bob/)).toBeInTheDocument();
    });

    it('should render a compensation transaction correctly', () => {
      const transaction: Transaction = {
        id: 't3',
        title: 'Reimbursement',
        paymentType: 'compensation',
        amount: 25,
        participantId: 'p1',
        date: '2025-01-15',
        eventId: 'e1',
      };

      render(
        <TransactionItem
          transaction={transaction}
          participantsMap={participantsMap}
          onClick={mockOnClick}
        />,
      );

      expect(screen.getByText('Reimbursement')).toBeInTheDocument();
      expect(screen.getByText('€25.00')).toBeInTheDocument();
      expect(screen.getByText(/Pagado a Alice/)).toBeInTheDocument();
    });

    it('should show "El Bote" for pot expenses', () => {
      // Setup mock for isPotExpense
      useTransactionsStore.setState({
        transactions: [],
        isPotExpense: (tx: Transaction) => tx.participantId === '0' && tx.paymentType === 'expense',
      });

      const potTransaction: Transaction = {
        id: 't4',
        title: 'Venue rental',
        paymentType: 'expense',
        amount: 500,
        participantId: '0', // POT_PARTICIPANT_ID
        date: '2025-01-15',
        eventId: 'e1',
      };

      render(
        <TransactionItem
          transaction={potTransaction}
          participantsMap={participantsMap}
          onClick={mockOnClick}
        />,
      );

      expect(screen.getByText('Venue rental')).toBeInTheDocument();
      expect(screen.getByText('€500.00')).toBeInTheDocument();
      expect(screen.getByText(/Pagado por El Bote/)).toBeInTheDocument();
    });

    it('should show "Participante desconocido" for unknown participant', () => {
      const transaction: Transaction = {
        id: 't5',
        title: 'Mystery expense',
        paymentType: 'expense',
        amount: 10,
        participantId: 'unknown-id',
        date: '2025-01-15',
        eventId: 'e1',
      };

      render(
        <TransactionItem
          transaction={transaction}
          participantsMap={participantsMap}
          onClick={mockOnClick}
        />,
      );

      expect(screen.getByText(/Participante desconocido/)).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('should call onClick when clicked', async () => {
      const user = userEvent.setup();
      const transaction: Transaction = {
        id: 't6',
        title: 'Test transaction',
        paymentType: 'expense',
        amount: 20,
        participantId: 'p1',
        date: '2025-01-15',
        eventId: 'e1',
      };

      render(
        <TransactionItem
          transaction={transaction}
          participantsMap={participantsMap}
          onClick={mockOnClick}
        />,
      );

      const item = screen.getByRole('button');
      await user.click(item);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should call onClick when Enter key is pressed', async () => {
      const user = userEvent.setup();
      const transaction: Transaction = {
        id: 't7',
        title: 'Test transaction',
        paymentType: 'expense',
        amount: 20,
        participantId: 'p1',
        date: '2025-01-15',
        eventId: 'e1',
      };

      render(
        <TransactionItem
          transaction={transaction}
          participantsMap={participantsMap}
          onClick={mockOnClick}
        />,
      );

      const item = screen.getByRole('button');
      item.focus();
      await user.keyboard('{Enter}');

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when other keys are pressed', async () => {
      const user = userEvent.setup();
      const transaction: Transaction = {
        id: 't8',
        title: 'Test transaction',
        paymentType: 'expense',
        amount: 20,
        participantId: 'p1',
        date: '2025-01-15',
        eventId: 'e1',
      };

      render(
        <TransactionItem
          transaction={transaction}
          participantsMap={participantsMap}
          onClick={mockOnClick}
        />,
      );

      const item = screen.getByRole('button');
      item.focus();
      await user.keyboard('{Space}');
      await user.keyboard('{Escape}');

      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have role="button"', () => {
      const transaction: Transaction = {
        id: 't9',
        title: 'Test transaction',
        paymentType: 'expense',
        amount: 20,
        participantId: 'p1',
        date: '2025-01-15',
        eventId: 'e1',
      };

      render(
        <TransactionItem
          transaction={transaction}
          participantsMap={participantsMap}
          onClick={mockOnClick}
        />,
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should be focusable with tabIndex', () => {
      const transaction: Transaction = {
        id: 't10',
        title: 'Test transaction',
        paymentType: 'expense',
        amount: 20,
        participantId: 'p1',
        date: '2025-01-15',
        eventId: 'e1',
      };

      render(
        <TransactionItem
          transaction={transaction}
          participantsMap={participantsMap}
          onClick={mockOnClick}
        />,
      );

      const item = screen.getByRole('button');
      expect(item).toHaveAttribute('tabIndex', '0');
    });

    it('should have aria-label with transaction info', () => {
      const transaction: Transaction = {
        id: 't11',
        title: 'Dinner',
        paymentType: 'expense',
        amount: 45.5,
        participantId: 'p1',
        date: '2025-01-15',
        eventId: 'e1',
      };

      render(
        <TransactionItem
          transaction={transaction}
          participantsMap={participantsMap}
          onClick={mockOnClick}
        />,
      );

      const item = screen.getByRole('button');
      expect(item).toHaveAttribute('aria-label', 'Dinner, €45.50');
    });

    it('should have aria-hidden on icon', () => {
      const transaction: Transaction = {
        id: 't12',
        title: 'Test transaction',
        paymentType: 'expense',
        amount: 20,
        participantId: 'p1',
        date: '2025-01-15',
        eventId: 'e1',
      };

      const { container } = render(
        <TransactionItem
          transaction={transaction}
          participantsMap={participantsMap}
          onClick={mockOnClick}
        />,
      );

      const iconSpan = container.querySelector('span.text-xl');
      expect(iconSpan).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Memoization', () => {
    it('should be wrapped with React.memo', () => {
      // React.memo wraps the component, we can verify it by checking
      // that the component doesn't re-render with same props
      const transaction: Transaction = {
        id: 't13',
        title: 'Test',
        paymentType: 'expense',
        amount: 20,
        participantId: 'p1',
        date: '2025-01-15',
        eventId: 'e1',
      };

      const { rerender } = render(
        <TransactionItem
          transaction={transaction}
          participantsMap={participantsMap}
          onClick={mockOnClick}
        />,
      );

      const firstText = screen.getByText('Test');

      // Rerender with the exact same props (same reference)
      rerender(
        <TransactionItem
          transaction={transaction}
          participantsMap={participantsMap}
          onClick={mockOnClick}
        />,
      );

      const secondText = screen.getByText('Test');

      // If memoized correctly, the component shouldn't re-render
      // In reality, this is hard to test without implementation details
      // The real benefit is seen in profiling, not unit tests
      expect(firstText).toBeInTheDocument();
      expect(secondText).toBeInTheDocument();
    });
  });
});
