import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Event } from '@/features/events/types';
import type { Transaction } from '../types';
import { useTransactionModal } from './useTransactionModal';

// Partial mock: the hook only needs `t`, but the module is also imported
// transitively by the i18n bootstrap, which needs the real `initReactI18next`.
vi.mock('react-i18next', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-i18next')>()),
  useTranslation: () => ({ t: (key: string) => key }),
}));

const idleMutation = { mutate: vi.fn(), isPending: false };

vi.mock('@/hooks/api/useTransactions', () => ({
  useCreateTransaction: () => idleMutation,
  useUpdateTransaction: () => idleMutation,
  useDeleteTransaction: () => idleMutation,
}));

const event = { id: 'e1', title: 'Trip', status: 'active', participants: [] } as unknown as Event;

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 't1',
    title: 'Dinner',
    paymentType: 'expense',
    amount: 25.5,
    participantId: 'p1',
    date: '2026-01-15',
    eventId: 'e1',
    ...overrides,
  };
}

function renderModal(transaction: Transaction | null) {
  return renderHook(() => useTransactionModal({ open: true, event, transaction, onClose: vi.fn() }));
}

describe('useTransactionModal', () => {
  describe('resetForm in edit mode', () => {
    it('preloads the amount with two decimals so it matches the list', () => {
      const { result } = renderModal(makeTransaction({ amount: 25.5 }));
      expect(result.current.amount).toBe('25.50');
    });

    it('preloads the amount when the API serializes it as a string', () => {
      // The decimal column can come back as a string from the backend.
      const transaction = makeTransaction({ amount: '25.50' as unknown as number });
      const { result } = renderModal(transaction);
      expect(result.current.amount).toBe('25.50');
    });

    it('preloads the remaining fields from the transaction', () => {
      const { result } = renderModal(makeTransaction());
      expect(result.current.title).toBe('Dinner');
      expect(result.current.type).toBe('expense');
      expect(result.current.participantId).toBe('p1');
      expect(result.current.date).toBe('2026-01-15');
    });
  });

  describe('isDirty', () => {
    it('is false right after preloading an untouched transaction', () => {
      // Guards the pairing between resetForm's toFixed(2) and the dirty check:
      // a string comparison would report '25.50' !== '25.5' and open the modal dirty.
      const { result } = renderModal(makeTransaction({ amount: 25.5 }));
      expect(result.current.isDirty).toBe(false);
    });

    it('is false when the API returned the amount as a string', () => {
      const transaction = makeTransaction({ amount: '25.50' as unknown as number });
      const { result } = renderModal(transaction);
      expect(result.current.isDirty).toBe(false);
    });

    it('stays false when the same amount is retyped with a different format', () => {
      const { result } = renderModal(makeTransaction({ amount: 25.5 }));
      act(() => result.current.setAmount('25.500'));
      expect(result.current.isDirty).toBe(false);
    });

    it('is true once the amount actually changes', () => {
      const { result } = renderModal(makeTransaction({ amount: 25.5 }));
      act(() => result.current.setAmount('30.00'));
      expect(result.current.isDirty).toBe(true);
    });
  });

  describe('create mode', () => {
    it('starts with an empty amount and cannot submit', () => {
      const { result } = renderModal(null);
      expect(result.current.amount).toBe('');
      expect(result.current.canSubmit).toBe(false);
    });
  });
});
