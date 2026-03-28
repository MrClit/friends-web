import { describe, expect, it } from 'vitest';
import type { EventKPIs } from '@/api/types';
import type { Event } from '@/features/events/types';
import { getKPIConfig } from '@/features/kpi/constants';
import {
  buildKPIItems,
  buildUserStatusSelectableParticipants,
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
      { id: 'u1', name: 'Alice' },
      { id: 'u2', name: 'Bob' },
      { id: 'g1', name: 'Guest One' },
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
