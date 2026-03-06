import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../entities/event.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { TransactionsService } from '../../transactions/transactions.service';
import { EventKPIsService } from './event-kpis.service';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.type';

describe('EventKPIsService', () => {
  let service: EventKPIsService;
  let eventRepository: { findOne: jest.Mock };
  let transactionsService: { findByEvent: jest.Mock };
  const actor: AuthenticatedUser = {
    id: 'user-1',
    email: 'user-1@example.com',
    role: 'user',
  };

  beforeEach(async () => {
    eventRepository = {
      findOne: jest.fn(),
    };

    transactionsService = {
      findByEvent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventKPIsService,
        {
          provide: getRepositoryToken(Event),
          useValue: eventRepository as unknown as Repository<Event>,
        },
        {
          provide: TransactionsService,
          useValue: transactionsService as unknown as TransactionsService,
        },
      ],
    }).compile();

    service = module.get<EventKPIsService>(EventKPIsService);
  });

  it('calculates KPIs including POT expenses and participant balances', async () => {
    eventRepository.findOne.mockResolvedValue({ id: 'event-1' } as Event);

    const transactions = [
      {
        id: 'tx-1',
        title: 'Contribution u1',
        participantId: 'u1',
        paymentType: 'contribution',
        amount: 100,
        date: new Date('2026-01-01'),
      },
      {
        id: 'tx-2',
        title: 'Expense u1',
        participantId: 'u1',
        paymentType: 'expense',
        amount: 40,
        date: new Date('2026-01-02'),
      },
      {
        id: 'tx-3',
        title: 'Compensation u1',
        participantId: 'u1',
        paymentType: 'compensation',
        amount: 10,
        date: new Date('2026-01-03'),
      },
      {
        id: 'tx-4',
        title: 'Hotel',
        participantId: '0',
        paymentType: 'expense',
        amount: 20,
        date: new Date('2026-01-04'),
      },
      {
        id: 'tx-5',
        title: 'Contribution u2',
        participantId: 'u2',
        paymentType: 'contribution',
        amount: '60',
        date: new Date('2026-01-05'),
      },
    ] as Transaction[];

    transactionsService.findByEvent.mockResolvedValue(transactions);

    const result = await service.getKPIs('event-1', actor);

    expect(result).toMatchObject({
      totalContributions: 160,
      totalExpenses: 60,
      totalCompensations: 10,
      potExpenses: 20,
      potBalance: 130,
      pendingToCompensate: 30,
    });

    expect(result.participantContributions).toEqual({ u1: 100, u2: 60 });
    expect(result.participantExpenses).toEqual({ u1: 40, u2: 0 });
    expect(result.participantCompensations).toEqual({ u1: 10, u2: 0 });
    expect(result.participantBalances).toEqual({ u1: 130, u2: 60 });
    expect(result.participantPending).toEqual({ u1: 30, u2: 0 });

    expect(result.balanceBreakdown).toEqual({
      inflows: {
        total: 160,
        contributionsByParticipant: { u1: 100, u2: 60 },
      },
      outflows: {
        total: 30,
        compensationsTotal: 10,
        compensationsByParticipant: { u1: 10, u2: 0 },
        potExpensesTotal: 20,
        potExpensesTransactions: [
          {
            id: 'tx-4',
            title: 'Hotel',
            amount: 20,
            date: '2026-01-04',
          },
        ],
      },
      participantNetWithPot: { u1: 90, u2: 60 },
      reconciliation: {
        inflows: 160,
        outflows: 30,
        potBalance: 130,
        isConsistent: true,
      },
    });

    expect(eventRepository.findOne).toHaveBeenCalledWith({ where: { id: 'event-1' } });
    expect(transactionsService.findByEvent).toHaveBeenCalledWith('event-1', actor);
  });

  it('builds balance breakdown correctly when only contributions exist', async () => {
    eventRepository.findOne.mockResolvedValue({ id: 'event-2' } as Event);
    transactionsService.findByEvent.mockResolvedValue([
      {
        id: 'tx-10',
        title: 'Contribution only',
        participantId: 'u1',
        paymentType: 'contribution',
        amount: 50,
        date: new Date('2026-01-06'),
      },
    ] as Transaction[]);

    const result = await service.getKPIs('event-2', actor);

    expect(result.potBalance).toBe(50);
    expect(result.balanceBreakdown.outflows.total).toBe(0);
    expect(result.balanceBreakdown.outflows.potExpensesTransactions).toEqual([]);
    expect(result.balanceBreakdown.reconciliation).toEqual({
      inflows: 50,
      outflows: 0,
      potBalance: 50,
      isConsistent: true,
    });
  });

  it('builds balance breakdown correctly when only pot expenses exist', async () => {
    eventRepository.findOne.mockResolvedValue({ id: 'event-3' } as Event);
    transactionsService.findByEvent.mockResolvedValue([
      {
        id: 'tx-20',
        title: 'Pot expense only',
        participantId: '0',
        paymentType: 'expense',
        amount: 30,
        date: new Date('2026-01-07'),
      },
    ] as Transaction[]);

    const result = await service.getKPIs('event-3', actor);

    expect(result.totalContributions).toBe(0);
    expect(result.potExpenses).toBe(30);
    expect(result.potBalance).toBe(-30);
    expect(result.balanceBreakdown).toEqual({
      inflows: {
        total: 0,
        contributionsByParticipant: {},
      },
      outflows: {
        total: 30,
        compensationsTotal: 0,
        compensationsByParticipant: {},
        potExpensesTotal: 30,
        potExpensesTransactions: [
          {
            id: 'tx-20',
            title: 'Pot expense only',
            amount: 30,
            date: '2026-01-07',
          },
        ],
      },
      participantNetWithPot: {},
      reconciliation: {
        inflows: 0,
        outflows: 30,
        potBalance: -30,
        isConsistent: true,
      },
    });
  });

  it('throws NotFoundException when event does not exist', async () => {
    eventRepository.findOne.mockResolvedValue(null);

    await expect(service.getKPIs('missing-event', actor)).rejects.toThrow(NotFoundException);
    expect(transactionsService.findByEvent).not.toHaveBeenCalled();
  });

  it('wraps unexpected errors in InternalServerErrorException', async () => {
    eventRepository.findOne.mockResolvedValue({ id: 'event-1' } as Event);
    transactionsService.findByEvent.mockRejectedValue(new Error('DB failure'));

    await expect(service.getKPIs('event-1', actor)).rejects.toThrow(InternalServerErrorException);
    await expect(service.getKPIs('event-1', actor)).rejects.toThrow('Failed to calculate KPIs');
  });
});
