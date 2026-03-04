import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../entities/event.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { TransactionsService } from '../../transactions/transactions.service';
import { EventKPIsService } from './event-kpis.service';

describe('EventKPIsService', () => {
  let service: EventKPIsService;
  let eventRepository: { findOne: jest.Mock };
  let transactionsService: { findByEvent: jest.Mock };

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
        participantId: 'u1',
        paymentType: 'contribution',
        amount: 100,
      },
      {
        participantId: 'u1',
        paymentType: 'expense',
        amount: 40,
      },
      {
        participantId: 'u1',
        paymentType: 'compensation',
        amount: 10,
      },
      {
        participantId: '0',
        paymentType: 'expense',
        amount: 20,
      },
      {
        participantId: 'u2',
        paymentType: 'contribution',
        amount: '60',
      },
    ] as Transaction[];

    transactionsService.findByEvent.mockResolvedValue(transactions);

    const result = await service.getKPIs('event-1');

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
    expect(result.participantBalances).toEqual({ u1: 50, u2: 60 });
    expect(result.participantPending).toEqual({ u1: 30, u2: 0 });

    expect(eventRepository.findOne).toHaveBeenCalledWith({ where: { id: 'event-1' } });
    expect(transactionsService.findByEvent).toHaveBeenCalledWith('event-1');
  });

  it('throws NotFoundException when event does not exist', async () => {
    eventRepository.findOne.mockResolvedValue(null);

    await expect(service.getKPIs('missing-event')).rejects.toThrow(NotFoundException);
    expect(transactionsService.findByEvent).not.toHaveBeenCalled();
  });

  it('wraps unexpected errors in InternalServerErrorException', async () => {
    eventRepository.findOne.mockResolvedValue({ id: 'event-1' } as Event);
    transactionsService.findByEvent.mockRejectedValue(new Error('DB failure'));

    await expect(service.getKPIs('event-1')).rejects.toThrow(InternalServerErrorException);
    await expect(service.getKPIs('event-1')).rejects.toThrow('Failed to calculate KPIs');
  });
});
