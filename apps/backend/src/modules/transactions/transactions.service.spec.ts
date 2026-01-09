import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { Transaction } from './entities/transaction.entity';
import { Event } from '../events/entities/event.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

describe('TransactionsService', () => {
  let service: TransactionsService;

  const mockEvent = {
    id: 'event-uuid-1',
    title: 'Test Event',
    participants: [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTransaction = {
    id: 'transaction-uuid-1',
    title: 'Test Transaction',
    paymentType: 'contribution' as const,
    amount: 50.0,
    participantId: '1',
    date: new Date('2026-01-01'),
    eventId: 'event-uuid-1',
    createdAt: new Date(),
  };

  const mockTransactionRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockEventRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockTransactionRepository,
        },
        {
          provide: getRepositoryToken(Event),
          useValue: mockEventRepository,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByEvent', () => {
    it('should return all transactions for an event', async () => {
      mockEventRepository.findOne.mockResolvedValue(mockEvent);
      mockTransactionRepository.find.mockResolvedValue([mockTransaction]);

      const result = await service.findByEvent('event-uuid-1');

      expect(mockEventRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'event-uuid-1' },
      });
      expect(mockTransactionRepository.find).toHaveBeenCalledWith({
        where: { eventId: 'event-uuid-1' },
        order: { date: 'DESC', createdAt: 'DESC' },
      });
      expect(result).toEqual([mockTransaction]);
    });

    it('should throw NotFoundException when event does not exist', async () => {
      mockEventRepository.findOne.mockResolvedValue(null);

      await expect(service.findByEvent('nonexistent-id')).rejects.toThrow(NotFoundException);
      await expect(service.findByEvent('nonexistent-id')).rejects.toThrow('Event with ID nonexistent-id not found');
    });

    it('should throw InternalServerErrorException on database error', async () => {
      mockEventRepository.findOne.mockRejectedValue(new Error('DB Error'));

      await expect(service.findByEvent('event-uuid-1')).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findByEventPaginated', () => {
    it('should return paginated transactions grouped by dates', async () => {
      mockEventRepository.findOne.mockResolvedValue(mockEvent);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest
          .fn()
          .mockResolvedValue([
            { date: new Date('2026-01-03') },
            { date: new Date('2026-01-02') },
            { date: new Date('2026-01-01') },
          ]),
      };

      mockTransactionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockTransactionRepository.find.mockResolvedValue([mockTransaction]);

      const result = await service.findByEventPaginated('event-uuid-1', 2, 0);

      expect(result).toEqual({
        transactions: [mockTransaction],
        hasMore: true,
        totalDates: 3,
        loadedDates: 2,
      });
    });

    it('should handle empty results', async () => {
      mockEventRepository.findOne.mockResolvedValue(mockEvent);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };

      mockTransactionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findByEventPaginated('event-uuid-1', 3, 0);

      expect(result).toEqual({
        transactions: [],
        hasMore: false,
        totalDates: 0,
        loadedDates: 0,
      });
    });

    it('should throw NotFoundException when event does not exist', async () => {
      mockEventRepository.findOne.mockResolvedValue(null);

      await expect(service.findByEventPaginated('nonexistent-id', 3, 0)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return a transaction by ID', async () => {
      mockTransactionRepository.findOne.mockResolvedValue(mockTransaction);

      const result = await service.findOne('transaction-uuid-1');

      expect(mockTransactionRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'transaction-uuid-1' },
      });
      expect(result).toEqual(mockTransaction);
    });

    it('should throw NotFoundException when transaction does not exist', async () => {
      mockTransactionRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('nonexistent-id')).rejects.toThrow('Transaction with ID nonexistent-id not found');
    });
  });

  describe('create', () => {
    const createDto: CreateTransactionDto = {
      title: 'New Transaction',
      paymentType: 'contribution',
      amount: 100,
      participantId: '1',
      date: '2026-01-01',
    };

    it('should create a transaction for valid participant', async () => {
      mockEventRepository.findOne.mockResolvedValue(mockEvent);
      mockTransactionRepository.create.mockReturnValue(mockTransaction);
      mockTransactionRepository.save.mockResolvedValue(mockTransaction);

      const result = await service.create('event-uuid-1', createDto);

      expect(mockEventRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'event-uuid-1' },
      });
      expect(mockTransactionRepository.create).toHaveBeenCalledWith({
        ...createDto,
        eventId: 'event-uuid-1',
      });
      expect(result).toEqual(mockTransaction);
    });

    it('should create a transaction for POT participant (id: 0)', async () => {
      mockEventRepository.findOne.mockResolvedValue(mockEvent);
      mockTransactionRepository.create.mockReturnValue(mockTransaction);
      mockTransactionRepository.save.mockResolvedValue(mockTransaction);

      const potDto = { ...createDto, participantId: '0' };
      await service.create('event-uuid-1', potDto);

      expect(mockTransactionRepository.create).toHaveBeenCalledWith({
        ...potDto,
        eventId: 'event-uuid-1',
      });
    });

    it('should throw NotFoundException when event does not exist', async () => {
      mockEventRepository.findOne.mockResolvedValue(null);

      await expect(service.create('nonexistent-id', createDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid participantId', async () => {
      mockEventRepository.findOne.mockResolvedValue(mockEvent);

      const invalidDto = { ...createDto, participantId: '999' };

      await expect(service.create('event-uuid-1', invalidDto)).rejects.toThrow(BadRequestException);
      await expect(service.create('event-uuid-1', invalidDto)).rejects.toThrow(
        'Participant with ID 999 does not exist in this event',
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateTransactionDto = {
      title: 'Updated Transaction',
      amount: 150,
    };

    it('should update a transaction', async () => {
      mockTransactionRepository.findOne
        .mockResolvedValueOnce(mockTransaction)
        .mockResolvedValueOnce({ ...mockTransaction, ...updateDto });
      mockEventRepository.findOne.mockResolvedValue(mockEvent);
      mockTransactionRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.update('transaction-uuid-1', updateDto);

      expect(mockTransactionRepository.update).toHaveBeenCalledWith('transaction-uuid-1', updateDto);
      expect(result.title).toEqual(updateDto.title);
      expect(result.amount).toEqual(updateDto.amount);
    });

    it('should validate participantId when updating', async () => {
      mockTransactionRepository.findOne.mockResolvedValue(mockTransaction);
      mockEventRepository.findOne.mockResolvedValue(mockEvent);

      const updateDtoWithInvalidParticipant = {
        ...updateDto,
        participantId: '999',
      };

      await expect(service.update('transaction-uuid-1', updateDtoWithInvalidParticipant)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when transaction does not exist', async () => {
      mockTransactionRepository.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent-id', updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a transaction', async () => {
      mockTransactionRepository.findOne.mockResolvedValue(mockTransaction);
      mockTransactionRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove('transaction-uuid-1');

      expect(mockTransactionRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'transaction-uuid-1' },
      });
      expect(mockTransactionRepository.delete).toHaveBeenCalledWith('transaction-uuid-1');
    });

    it('should throw NotFoundException when transaction does not exist', async () => {
      mockTransactionRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });
});
