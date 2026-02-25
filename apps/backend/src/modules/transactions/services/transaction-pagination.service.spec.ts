import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../../events/entities/event.entity';
import { Transaction } from '../entities/transaction.entity';
import { TransactionPaginationService } from './transaction-pagination.service';

describe('TransactionPaginationService', () => {
  let service: TransactionPaginationService;
  let transactionRepository: { query: jest.Mock };
  let eventRepository: { findOne: jest.Mock };

  beforeEach(async () => {
    transactionRepository = {
      query: jest.fn(),
    };

    eventRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionPaginationService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: transactionRepository as unknown as Repository<Transaction>,
        },
        {
          provide: getRepositoryToken(Event),
          useValue: eventRepository as unknown as Repository<Event>,
        },
      ],
    }).compile();

    service = module.get<TransactionPaginationService>(TransactionPaginationService);
  });

  it('returns paginated transactions mapped from raw SQL results', async () => {
    eventRepository.findOne.mockResolvedValue({ id: 'event-1' } as Event);
    transactionRepository.query.mockResolvedValue([
      {
        id: 'tx-1',
        event_id: 'event-1',
        participant_id: 'p-1',
        payment_type: 'expense',
        amount: '10.50',
        title: 'Dinner',
        date: new Date('2026-02-25T00:00:00.000Z'),
        created_at: new Date('2026-02-25T10:00:00.000Z'),
        date_rank: 1,
        total_dates: '3',
      },
      {
        id: 'tx-2',
        event_id: 'event-1',
        participant_id: 'p-2',
        payment_type: 'contribution',
        amount: '20.00',
        title: 'Top up',
        date: new Date('2026-02-24T00:00:00.000Z'),
        created_at: new Date('2026-02-24T10:00:00.000Z'),
        date_rank: 2,
        total_dates: '3',
      },
    ]);

    const result = await service.findByEventPaginated('event-1', 2, 0);

    expect(result.totalDates).toBe(3);
    expect(result.loadedDates).toBe(2);
    expect(result.hasMore).toBe(true);
    expect(result.transactions).toHaveLength(2);
    expect(result.transactions[0]).toMatchObject({
      id: 'tx-1',
      eventId: 'event-1',
      participantId: 'p-1',
      paymentType: 'expense',
      amount: 10.5,
      title: 'Dinner',
    });
    expect(eventRepository.findOne).toHaveBeenCalledWith({ where: { id: 'event-1' } });
    expect(transactionRepository.query).toHaveBeenCalledTimes(1);
  });

  it('throws NotFoundException when event does not exist', async () => {
    eventRepository.findOne.mockResolvedValue(null);

    await expect(service.findByEventPaginated('missing-event', 2, 0)).rejects.toThrow(NotFoundException);
    expect(transactionRepository.query).not.toHaveBeenCalled();
  });

  it('passes through BadRequestException from query flow', async () => {
    eventRepository.findOne.mockResolvedValue({ id: 'event-1' } as Event);
    transactionRepository.query.mockRejectedValue(new BadRequestException('Invalid pagination params'));

    await expect(service.findByEventPaginated('event-1', 2, 0)).rejects.toThrow(BadRequestException);
  });

  it('wraps unexpected errors in InternalServerErrorException', async () => {
    eventRepository.findOne.mockResolvedValue({ id: 'event-1' } as Event);
    transactionRepository.query.mockRejectedValue(new Error('DB failure'));

    await expect(service.findByEventPaginated('event-1', 2, 0)).rejects.toThrow(InternalServerErrorException);
    await expect(service.findByEventPaginated('event-1', 2, 0)).rejects.toThrow(
      'Failed to fetch paginated transactions',
    );
  });
});
