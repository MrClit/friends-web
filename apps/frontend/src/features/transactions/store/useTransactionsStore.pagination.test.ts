import { describe, it, expect, beforeEach } from 'vitest';
import { useTransactionsStore } from './useTransactionsStore';

/**
 * Tests for pagination methods in the Transactions Zustand store
 * Tests date-based chunking pagination logic
 */
describe('useTransactionsStore - Pagination', () => {
  const testEventId = 'test-event-1';
  const testEventId2 = 'test-event-2';

  // Reset store before each test
  beforeEach(() => {
    useTransactionsStore.setState({ transactions: [] });
    localStorage.clear();
  });

  describe('getTransactionsByEventPaginated', () => {
    it('should return paginated transactions by date', () => {
      // Create transactions across 5 different dates
      const dates = ['2025-01-05', '2025-01-04', '2025-01-03', '2025-01-02', '2025-01-01'];
      dates.forEach((date, index) => {
        useTransactionsStore.getState().addExpense({
          eventId: testEventId,
          title: `Transaction ${index}`,
          paymentType: 'expense',
          amount: 10,
          participantId: 'p1',
          date,
        });
      });

      // Request first 3 dates
      const result = useTransactionsStore
        .getState()
        .getTransactionsByEventPaginated(testEventId, 3, 0);

      expect(result.transactions).toHaveLength(3);
      expect(result.totalDates).toBe(5);
      expect(result.loadedDates).toBe(3);
      expect(result.hasMore).toBe(true);
      // Should return most recent dates first
      expect(result.transactions[0].date).toBe('2025-01-05');
      expect(result.transactions[1].date).toBe('2025-01-04');
      expect(result.transactions[2].date).toBe('2025-01-03');
    });

    it('should return hasMore: true when more dates exist', () => {
      // Create transactions across 10 different dates
      for (let i = 1; i <= 10; i++) {
        useTransactionsStore.getState().addExpense({
          eventId: testEventId,
          title: `Transaction ${i}`,
          paymentType: 'expense',
          amount: 10,
          participantId: 'p1',
          date: `2025-01-${String(i).padStart(2, '0')}`,
        });
      }

      const result = useTransactionsStore
        .getState()
        .getTransactionsByEventPaginated(testEventId, 5, 0);

      expect(result.hasMore).toBe(true);
      expect(result.totalDates).toBe(10);
      expect(result.loadedDates).toBe(5);
    });

    it('should return hasMore: false when all dates loaded', () => {
      // Create transactions across 3 different dates
      for (let i = 1; i <= 3; i++) {
        useTransactionsStore.getState().addExpense({
          eventId: testEventId,
          title: `Transaction ${i}`,
          paymentType: 'expense',
          amount: 10,
          participantId: 'p1',
          date: `2025-01-0${i}`,
        });
      }

      // Request 5 dates but only 3 exist
      const result = useTransactionsStore
        .getState()
        .getTransactionsByEventPaginated(testEventId, 5, 0);

      expect(result.hasMore).toBe(false);
      expect(result.totalDates).toBe(3);
      expect(result.loadedDates).toBe(3);
    });

    it('should handle offset correctly for pagination', () => {
      // Create transactions across 10 different dates
      for (let i = 1; i <= 10; i++) {
        useTransactionsStore.getState().addExpense({
          eventId: testEventId,
          title: `Transaction ${i}`,
          paymentType: 'expense',
          amount: 10,
          participantId: 'p1',
          date: `2025-01-${String(i).padStart(2, '0')}`,
        });
      }

      // First page: offset 0, load 5 dates
      const page1 = useTransactionsStore
        .getState()
        .getTransactionsByEventPaginated(testEventId, 5, 0);
      expect(page1.loadedDates).toBe(5);
      expect(page1.hasMore).toBe(true);
      expect(page1.transactions[0].date).toBe('2025-01-10'); // Most recent

      // Second page: offset 5, load 5 more dates
      const page2 = useTransactionsStore
        .getState()
        .getTransactionsByEventPaginated(testEventId, 5, 5);
      expect(page2.loadedDates).toBe(5);
      expect(page2.hasMore).toBe(false);
      expect(page2.transactions[0].date).toBe('2025-01-05'); // Older dates
    });

    it('should group multiple transactions on the same date', () => {
      const sameDate = '2025-01-05';
      // Create 3 transactions on the same date
      for (let i = 1; i <= 3; i++) {
        useTransactionsStore.getState().addExpense({
          eventId: testEventId,
          title: `Transaction ${i}`,
          paymentType: 'expense',
          amount: 10 * i,
          participantId: 'p1',
          date: sameDate,
        });
      }

      // Add one transaction on a different date
      useTransactionsStore.getState().addExpense({
        eventId: testEventId,
        title: 'Transaction 4',
        paymentType: 'expense',
        amount: 40,
        participantId: 'p1',
        date: '2025-01-04',
      });

      // Load first date (should include all 3 transactions from that date)
      const result = useTransactionsStore
        .getState()
        .getTransactionsByEventPaginated(testEventId, 1, 0);

      expect(result.loadedDates).toBe(1);
      expect(result.transactions).toHaveLength(3); // All 3 from the same date
      expect(result.totalDates).toBe(2);
      expect(result.hasMore).toBe(true);
    });

    it('should filter by eventId correctly', () => {
      // Create transactions for two different events
      useTransactionsStore.getState().addExpense({
        eventId: testEventId,
        title: 'Event 1 Transaction',
        paymentType: 'expense',
        amount: 10,
        participantId: 'p1',
        date: '2025-01-05',
      });

      useTransactionsStore.getState().addExpense({
        eventId: testEventId2,
        title: 'Event 2 Transaction',
        paymentType: 'expense',
        amount: 20,
        participantId: 'p1',
        date: '2025-01-05',
      });

      const result = useTransactionsStore
        .getState()
        .getTransactionsByEventPaginated(testEventId, 10, 0);

      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].title).toBe('Event 1 Transaction');
      expect(result.totalDates).toBe(1);
    });

    it('should return empty result for event with no transactions', () => {
      const result = useTransactionsStore
        .getState()
        .getTransactionsByEventPaginated('non-existent-event', 10, 0);

      expect(result.transactions).toHaveLength(0);
      expect(result.hasMore).toBe(false);
      expect(result.totalDates).toBe(0);
      expect(result.loadedDates).toBe(0);
    });

    it('should use default values for numberOfDates and offset', () => {
      // Create 15 transactions across 15 different dates
      for (let i = 1; i <= 15; i++) {
        useTransactionsStore.getState().addExpense({
          eventId: testEventId,
          title: `Transaction ${i}`,
          paymentType: 'expense',
          amount: 10,
          participantId: 'p1',
          date: `2025-01-${String(i).padStart(2, '0')}`,
        });
      }

      // Call without parameters (should use defaults: numberOfDates=10, offset=0)
      const result = useTransactionsStore.getState().getTransactionsByEventPaginated(testEventId);

      expect(result.loadedDates).toBe(10); // Default numberOfDates
      expect(result.hasMore).toBe(true); // 15 total, loaded 10
      expect(result.totalDates).toBe(15);
    });

    it('should sort dates in descending order (most recent first)', () => {
      const dates = ['2025-01-01', '2025-01-05', '2025-01-03', '2025-01-02', '2025-01-04'];
      dates.forEach((date, index) => {
        useTransactionsStore.getState().addExpense({
          eventId: testEventId,
          title: `Transaction ${index}`,
          paymentType: 'expense',
          amount: 10,
          participantId: 'p1',
          date,
        });
      });

      const result = useTransactionsStore
        .getState()
        .getTransactionsByEventPaginated(testEventId, 5, 0);

      // Should be sorted descending (newest first)
      expect(result.transactions[0].date).toBe('2025-01-05');
      expect(result.transactions[1].date).toBe('2025-01-04');
      expect(result.transactions[2].date).toBe('2025-01-03');
      expect(result.transactions[3].date).toBe('2025-01-02');
      expect(result.transactions[4].date).toBe('2025-01-01');
    });
  });

  describe('getAvailableDatesCount', () => {
    it('should return the number of unique dates for an event', () => {
      // Create transactions across 5 different dates
      for (let i = 1; i <= 5; i++) {
        useTransactionsStore.getState().addExpense({
          eventId: testEventId,
          title: `Transaction ${i}`,
          paymentType: 'expense',
          amount: 10,
          participantId: 'p1',
          date: `2025-01-0${i}`,
        });
      }

      const count = useTransactionsStore.getState().getAvailableDatesCount(testEventId);
      expect(count).toBe(5);
    });

    it('should count dates correctly when multiple transactions share the same date', () => {
      const sameDate = '2025-01-05';
      // Create 3 transactions on the same date
      for (let i = 1; i <= 3; i++) {
        useTransactionsStore.getState().addExpense({
          eventId: testEventId,
          title: `Transaction ${i}`,
          paymentType: 'expense',
          amount: 10,
          participantId: 'p1',
          date: sameDate,
        });
      }

      const count = useTransactionsStore.getState().getAvailableDatesCount(testEventId);
      expect(count).toBe(1); // Only 1 unique date
    });

    it('should return 0 for event with no transactions', () => {
      const count = useTransactionsStore.getState().getAvailableDatesCount('non-existent-event');
      expect(count).toBe(0);
    });

    it('should filter by eventId correctly', () => {
      // Create transactions for two different events
      useTransactionsStore.getState().addExpense({
        eventId: testEventId,
        title: 'Event 1 Transaction 1',
        paymentType: 'expense',
        amount: 10,
        participantId: 'p1',
        date: '2025-01-01',
      });

      useTransactionsStore.getState().addExpense({
        eventId: testEventId,
        title: 'Event 1 Transaction 2',
        paymentType: 'expense',
        amount: 10,
        participantId: 'p1',
        date: '2025-01-02',
      });

      useTransactionsStore.getState().addExpense({
        eventId: testEventId2,
        title: 'Event 2 Transaction',
        paymentType: 'expense',
        amount: 20,
        participantId: 'p1',
        date: '2025-01-03',
      });

      const count1 = useTransactionsStore.getState().getAvailableDatesCount(testEventId);
      const count2 = useTransactionsStore.getState().getAvailableDatesCount(testEventId2);

      expect(count1).toBe(2);
      expect(count2).toBe(1);
    });
  });
});
