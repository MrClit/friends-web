import { describe, expect, it } from 'vitest';
import type { EventKPIBalanceBreakdown, EventKPIs } from '@/api/types';
import type { Event } from '@/features/events/types';
import { formatAmount } from '@/shared/utils/format';
import { getKPIConfig } from '@/features/kpi/constants';
import {
  buildBalanceBreakdownData,
  buildKPIItems,
  buildUserStatusSelectableParticipants,
  formatPercent,
  formatSignedAmount,
  resolveUserStatusParticipantId,
  buildUserStatusSummaryData,
} from './utils';

const t = ((key: string) => key) as never;

const baseEvent: Event = {
  id: 'event-1',
  title: 'Trip',
  description: 'Weekend',
  icon: 'flight',
  status: 'active',
  participants: [
    { type: 'user', id: 'u1', name: 'Alice' },
    { type: 'user', id: 'u2', name: 'Bob' },
    { type: 'guest', id: 'g1', name: 'Guest One' },
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  lastModified: '2026-01-01T00:00:00.000Z',
};

const baseKpis: EventKPIs = {
  totalExpenses: 0,
  totalContributions: 0,
  totalCompensations: 0,
  potBalance: 0,
  pendingToCompensate: 0,
  participantBalances: {},
  participantContributions: {},
  participantExpenses: {},
  participantCompensations: {},
  participantPending: {},
  potExpenses: 0,
  balanceBreakdown: {
    inflows: {
      total: 0,
      contributionsByParticipant: {},
    },
    outflows: {
      total: 0,
      compensationsTotal: 0,
      compensationsByParticipant: {},
      potExpensesTotal: 0,
      potExpensesTransactions: [],
    },
    participantNetWithPot: {},
    reconciliation: {
      inflows: 0,
      outflows: 0,
      potBalance: 0,
      isConsistent: true,
    },
  },
};

describe('buildKPIItems', () => {
  it('sorts contribution status items by absolute value and uses absolute percentage base', () => {
    const kpiConfig = getKPIConfig(t);

    const items = buildKPIItems(
      {
        u1: -40,
        u2: 10,
        g1: -20,
      },
      baseEvent,
      'contributionStatus',
      kpiConfig,
      0,
      t,
    );

    // Sorted by absolute magnitude for contribution status KPI
    expect(items.map((item) => item.id)).toEqual(['u1', 'g1', 'u2']);

    // Percentage base should be sum(abs(values)) = 70
    const [first, second, third] = items;
    expect(first.percentage).toBeCloseTo((40 / 70) * 100, 6);
    expect(second.percentage).toBeCloseTo((20 / 70) * 100, 6);
    expect(third.percentage).toBeCloseTo((10 / 70) * 100, 6);

    expect(first.rawAmount).toBe(-40);
    expect(second.rawAmount).toBe(-20);
    expect(third.rawAmount).toBe(10);
  });

  it('keeps descending sort for non-contribution status KPIs', () => {
    const kpiConfig = getKPIConfig(t);

    const items = buildKPIItems(
      {
        u1: 30,
        u2: 50,
        g1: 20,
      },
      baseEvent,
      'expenses',
      kpiConfig,
      0,
      t,
    );

    expect(items.map((item) => item.id)).toEqual(['u2', 'u1', 'g1']);
  });

  it('builds user-status selectable participants with users and guests only', () => {
    const participants = buildUserStatusSelectableParticipants(
      {
        ...baseEvent,
        participants: [...baseEvent.participants, { type: 'pot', id: '0' }],
      },
      t,
    );

    expect(participants).toEqual([
      { id: 'u1', name: 'Alice', avatar: null },
      { id: 'u2', name: 'Bob', avatar: null },
      { id: 'g1', name: 'Guest One', avatar: null },
    ]);
  });

  it('resolves user-status participant with query priority and user fallback', () => {
    const selectableParticipants = [
      { id: 'u1', name: 'Alice' },
      { id: 'g1', name: 'Guest One' },
    ];

    expect(resolveUserStatusParticipantId(selectableParticipants, 'u1', 'g1')).toBe('g1');
    expect(resolveUserStatusParticipantId(selectableParticipants, 'u1', undefined)).toBe('u1');
    expect(resolveUserStatusParticipantId(selectableParticipants, 'admin-id', undefined)).toBeUndefined();
  });

  it('builds user-status summary data for selected participant', () => {
    const eventWithTargets: Event = {
      ...baseEvent,
      participants: [
        { type: 'user', id: 'u1', name: 'Alice', contributionTarget: 100 },
        { type: 'user', id: 'u2', name: 'Bob', contributionTarget: 0 },
        { type: 'guest', id: 'g1', name: 'Guest One', contributionTarget: 25 },
      ],
    };

    const summary = buildUserStatusSummaryData(
      eventWithTargets,
      {
        ...baseKpis,
        participantPending: {
          u1: -20,
        },
      },
      'u1',
      'u1',
      t,
    );

    expect(summary).toEqual({
      participantId: 'u1',
      participantName: 'Alice',
      compliancePercent: 80,
      netTotal: 80,
      targetTotal: 100,
      differenceTotal: -20,
      adjustmentPending: 20,
      isCurrentUser: true,
    });
  });
});

describe('formatPercent', () => {
  it('returns "--" for undefined', () => {
    expect(formatPercent(undefined)).toBe('--');
  });

  it('returns "--" for NaN', () => {
    expect(formatPercent(NaN)).toBe('--');
  });

  it('returns "--" for Infinity', () => {
    expect(formatPercent(Infinity)).toBe('--');
  });

  it('formats a finite value to one decimal place', () => {
    expect(formatPercent(80)).toBe('80.0%');
    expect(formatPercent(33.333)).toBe('33.3%');
    expect(formatPercent(0)).toBe('0.0%');
  });
});

describe('formatSignedAmount', () => {
  it('returns unsigned amount for zero', () => {
    expect(formatSignedAmount(0)).toBe(formatAmount(0));
  });

  it('prefixes positive values with "+"', () => {
    expect(formatSignedAmount(50)).toBe(`+${formatAmount(50)}`);
  });

  it('prefixes negative values with "-" using the absolute value', () => {
    expect(formatSignedAmount(-20)).toBe(`-${formatAmount(20)}`);
  });
});

describe('buildBalanceBreakdownData', () => {
  const emptyBreakdown: EventKPIBalanceBreakdown = {
    inflows: { total: 0, contributionsByParticipant: {} },
    outflows: {
      total: 0,
      compensationsTotal: 0,
      compensationsByParticipant: {},
      potExpensesTotal: 0,
      potExpensesTransactions: [],
    },
    participantNetWithPot: {},
    reconciliation: { inflows: 0, outflows: 0, potBalance: 0, isConsistent: true },
  };

  it('maps totals and flags directly from the breakdown', () => {
    const breakdown: EventKPIBalanceBreakdown = {
      ...emptyBreakdown,
      inflows: { total: 300, contributionsByParticipant: {} },
      outflows: {
        total: 50,
        compensationsTotal: 30,
        compensationsByParticipant: {},
        potExpensesTotal: 20,
        potExpensesTransactions: [],
      },
      reconciliation: { inflows: 300, outflows: 50, potBalance: 10, isConsistent: false },
    };

    const result = buildBalanceBreakdownData(breakdown, baseEvent, t);

    expect(result.inflowsTotal).toBe(300);
    expect(result.compensationsTotal).toBe(30);
    expect(result.potExpensesTotal).toBe(20);
    expect(result.outflowsTotal).toBe(50);
    expect(result.potBalance).toBe(10);
    expect(result.isConsistent).toBe(false);
    expect(result.inflowItems).toEqual([]);
    expect(result.compensationItems).toEqual([]);
    expect(result.potExpenseItems).toEqual([]);
  });

  it('builds inflow items sorted by amount descending, filtering out zero and negative', () => {
    const breakdown: EventKPIBalanceBreakdown = {
      ...emptyBreakdown,
      inflows: {
        total: 300,
        contributionsByParticipant: { u1: 200, u2: 100, g1: 0 },
      },
    };

    const result = buildBalanceBreakdownData(breakdown, baseEvent, t);

    expect(result.inflowItems.map((i) => i.id)).toEqual(['u1', 'u2']);
    expect(result.inflowItems[0].amount).toBe(200);
    expect(result.inflowItems[1].amount).toBe(100);
  });

  it('builds compensation items sorted by amount descending', () => {
    const breakdown: EventKPIBalanceBreakdown = {
      ...emptyBreakdown,
      outflows: {
        ...emptyBreakdown.outflows,
        compensationsByParticipant: { u2: 80, u1: 120 },
      },
    };

    const result = buildBalanceBreakdownData(breakdown, baseEvent, t);

    expect(result.compensationItems.map((i) => i.id)).toEqual(['u1', 'u2']);
    expect(result.compensationItems[0].amount).toBe(120);
  });

  it('builds pot expense items sorted by amount descending, filtering zero amounts', () => {
    const breakdown: EventKPIBalanceBreakdown = {
      ...emptyBreakdown,
      outflows: {
        ...emptyBreakdown.outflows,
        potExpensesTransactions: [
          { id: 'tx1', title: 'Dinner', amount: 50, date: '2026-01-02' },
          { id: 'tx2', title: 'Taxi', amount: 120, date: '2026-01-01' },
          { id: 'tx3', title: 'Zero', amount: 0, date: '2026-01-03' },
        ],
      },
    };

    const result = buildBalanceBreakdownData(breakdown, baseEvent, t);

    expect(result.potExpenseItems.map((i) => i.id)).toEqual(['tx2', 'tx1']);
    expect(result.potExpenseItems[0].title).toBe('Taxi');
    expect(result.potExpenseItems[0].amount).toBe(120);
  });

  it('resolves participant name from event for inflow items', () => {
    const breakdown: EventKPIBalanceBreakdown = {
      ...emptyBreakdown,
      inflows: { total: 100, contributionsByParticipant: { u1: 100 } },
    };

    const result = buildBalanceBreakdownData(breakdown, baseEvent, t);

    expect(result.inflowItems[0].name).toBe('Alice');
  });
});

describe('buildUserStatusSummaryData — edge cases', () => {
  it('returns undefined when participantId is undefined', () => {
    expect(buildUserStatusSummaryData(baseEvent, baseKpis, undefined, 'u1', t)).toBeUndefined();
  });

  it('returns undefined when participantId does not match any participant', () => {
    expect(buildUserStatusSummaryData(baseEvent, baseKpis, 'unknown-id', 'u1', t)).toBeUndefined();
  });

  it('returns compliancePercent undefined when targetTotal is 0', () => {
    const summary = buildUserStatusSummaryData(baseEvent, baseKpis, 'u1', 'u1', t);

    expect(summary).toBeDefined();
    expect(summary!.compliancePercent).toBeUndefined();
    expect(summary!.targetTotal).toBe(0);
  });

  it('marks isCurrentUser false when participantId differs from currentUserId', () => {
    const summary = buildUserStatusSummaryData(baseEvent, baseKpis, 'u1', 'u2', t);

    expect(summary!.isCurrentUser).toBe(false);
  });
});

describe('buildKPIItems — pot and targetValue', () => {
  it('includes a pot item when KPI has includePot=true and potExpenses > 0', () => {
    const kpiConfig = getKPIConfig(t);

    const items = buildKPIItems({ u1: 50, u2: 30 }, baseEvent, 'expenses', kpiConfig, 20, t);

    const potItem = items.find((item) => item.isPot);
    expect(potItem).toBeDefined();
    expect(potItem!.id).toBe('0');
    expect(potItem!.rawAmount).toBe(20);
    expect(potItem!.name).toBe('transactionsList.potLabel');
  });

  it('does not include a pot item when potExpenses is 0', () => {
    const kpiConfig = getKPIConfig(t);

    const items = buildKPIItems({ u1: 50 }, baseEvent, 'expenses', kpiConfig, 0, t);

    expect(items.every((item) => !item.isPot)).toBe(true);
  });

  it('includes targetValue for contributionStatus KPI items', () => {
    const kpiConfig = getKPIConfig(t);
    const eventWithTargets: Event = {
      ...baseEvent,
      participants: [{ type: 'user', id: 'u1', name: 'Alice', contributionTarget: 100 }],
    };

    const items = buildKPIItems({ u1: 80 }, eventWithTargets, 'contributionStatus', kpiConfig, 0, t);

    expect(items[0].targetValue).toBe(formatAmount(100));
  });

  it('omits targetValue for non-contributionStatus KPI items', () => {
    const kpiConfig = getKPIConfig(t);
    const eventWithTargets: Event = {
      ...baseEvent,
      participants: [{ type: 'user', id: 'u1', name: 'Alice', contributionTarget: 100 }],
    };

    const items = buildKPIItems({ u1: 80 }, eventWithTargets, 'expenses', kpiConfig, 0, t);

    expect(items[0].targetValue).toBeUndefined();
  });

  it('returns 0% when percentageBase is 0', () => {
    const kpiConfig = getKPIConfig(t);

    const items = buildKPIItems({ u1: 0 }, baseEvent, 'expenses', kpiConfig, 0, t);

    expect(items[0].percentage).toBe(0);
  });
});
