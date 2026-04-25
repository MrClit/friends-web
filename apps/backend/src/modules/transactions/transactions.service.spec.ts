import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { Transaction } from './entities/transaction.entity';
import { Event } from '../events/entities/event.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ParticipantValidationService } from './services/participant-validation.service';
import { TransactionPaginationService } from './services/transaction-pagination.service';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { RequestContextService } from '../../common/request-context/request-context.service';

describe('TransactionsService', () => {
  let service: TransactionsService;

  const adminActor: AuthenticatedUser = {
    id: 'admin-1',
    email: 'admin@example.com',
    role: 'admin',
  };

  const memberActor: AuthenticatedUser = {
    id: 'user-1',
    email: 'user-1@example.com',
    role: 'user',
  };

  const outsiderActor: AuthenticatedUser = {
    id: 'user-2',
    email: 'user-2@example.com',
    role: 'user',
  };

  const mockEvent = {
    id: 'event-uuid-1',
    title: 'Test Event',
    participants: [
      { type: 'user', id: memberActor.id },
      { type: 'guest', id: 'g1', name: 'Guest 1' },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as Event;

  const mockTransaction = {
    id: 'transaction-uuid-1',
    title: 'Test Transaction',
    paymentType: 'contribution' as const,
    amount: 50.0,
    participantId: 'g1',
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
    softDelete: jest.fn(),
    createQueryBuilder: jest.fn(),
    query: jest.fn(),
  };

  const mockEventRepository = {
    findOne: jest.fn(),
  };

  const mockParticipantValidationService = {
    validateParticipantId: jest.fn(),
  };

  const mockTransactionPaginationService = {
    findByEventPaginated: jest.fn(),
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
        {
          provide: ParticipantValidationService,
          useValue: mockParticipantValidationService,
        },
        {
          provide: TransactionPaginationService,
          useValue: mockTransactionPaginationService,
        },
        {
          provide: RequestContextService,
          useValue: { correlationId: 'test-correlation-id' },
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByEvent', () => {
    it('returns transactions for participant user', async () => {
      mockEventRepository.findOne.mockResolvedValue(mockEvent);
      mockTransactionRepository.find.mockResolvedValue([mockTransaction]);

      const result = await service.findByEvent('event-uuid-1', memberActor);

      expect(mockEventRepository.findOne).toHaveBeenCalledWith({ where: { id: 'event-uuid-1' } });
      expect(mockTransactionRepository.find).toHaveBeenCalledWith({
        where: { eventId: 'event-uuid-1' },
        order: { date: 'DESC', createdAt: 'DESC' },
      });
      expect(result).toEqual([mockTransaction]);
    });

    it('throws NotFoundException when event does not exist', async () => {
      mockEventRepository.findOne.mockResolvedValue(null);

      await expect(service.findByEvent('nonexistent-id', memberActor)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when user is not participant', async () => {
      mockEventRepository.findOne.mockResolvedValue(mockEvent);

      await expect(service.findByEvent('event-uuid-1', outsiderActor)).rejects.toThrow(ForbiddenException);
    });

    it('throws InternalServerErrorException on repository error', async () => {
      mockEventRepository.findOne.mockRejectedValue(new Error('DB Error'));

      await expect(service.findByEvent('event-uuid-1', adminActor)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findByEventPaginated', () => {
    it('returns paginated result for authorized actor', async () => {
      const mockResult = {
        transactions: [mockTransaction],
        hasMore: true,
        totalDates: 3,
        loadedDates: 1,
      };

      mockEventRepository.findOne.mockResolvedValue(mockEvent);
      mockTransactionPaginationService.findByEventPaginated.mockResolvedValue(mockResult);

      const result = await service.findByEventPaginated('event-uuid-1', 2, 0, memberActor);

      expect(mockEventRepository.findOne).toHaveBeenCalledWith({ where: { id: 'event-uuid-1' } });
      expect(mockTransactionPaginationService.findByEventPaginated).toHaveBeenCalledWith('event-uuid-1', 2, 0);
      expect(result).toEqual(mockResult);
    });

    it('throws NotFoundException when event does not exist', async () => {
      mockEventRepository.findOne.mockResolvedValue(null);

      await expect(service.findByEventPaginated('nonexistent-id', 3, 0, adminActor)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('returns transaction by ID for admin actor', async () => {
      mockTransactionRepository.findOne.mockResolvedValue(mockTransaction);

      const result = await service.findOne('transaction-uuid-1', adminActor);

      expect(mockTransactionRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'transaction-uuid-1' },
      });
      expect(result).toEqual(mockTransaction);
    });

    it('throws NotFoundException when transaction does not exist', async () => {
      mockTransactionRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id', adminActor)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when user cannot access parent event', async () => {
      mockTransactionRepository.findOne.mockResolvedValue(mockTransaction);
      mockEventRepository.findOne.mockResolvedValue(mockEvent);

      await expect(service.findOne('transaction-uuid-1', outsiderActor)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('create', () => {
    const createDto: CreateTransactionDto = {
      title: 'New Transaction',
      paymentType: 'contribution',
      amount: 100,
      participantId: 'g1',
      date: '2026-01-01',
    };

    it('creates a transaction for valid participant', async () => {
      mockEventRepository.findOne.mockResolvedValue(mockEvent);
      mockTransactionRepository.create.mockReturnValue(mockTransaction);
      mockTransactionRepository.save.mockResolvedValue(mockTransaction);

      const result = await service.create('event-uuid-1', createDto, memberActor);

      expect(mockEventRepository.findOne).toHaveBeenCalledWith({ where: { id: 'event-uuid-1' } });
      expect(mockTransactionRepository.create).toHaveBeenCalledWith({
        ...createDto,
        eventId: 'event-uuid-1',
      });
      expect(result).toEqual(mockTransaction);
    });

    it('creates a transaction for POT participant (id: 0)', async () => {
      const potDto: CreateTransactionDto = {
        ...createDto,
        participantId: '0',
      };

      mockEventRepository.findOne.mockResolvedValue(mockEvent);
      mockTransactionRepository.create.mockReturnValue(mockTransaction);
      mockTransactionRepository.save.mockResolvedValue(mockTransaction);

      await service.create('event-uuid-1', potDto, memberActor);

      expect(mockTransactionRepository.create).toHaveBeenCalledWith({
        ...potDto,
        eventId: 'event-uuid-1',
      });
    });

    it('throws NotFoundException when event does not exist', async () => {
      mockEventRepository.findOne.mockResolvedValue(null);

      await expect(service.create('nonexistent-id', createDto, adminActor)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when user is not participant', async () => {
      mockEventRepository.findOne.mockResolvedValue(mockEvent);

      await expect(service.create('event-uuid-1', createDto, outsiderActor)).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException for invalid participantId', async () => {
      mockEventRepository.findOne.mockResolvedValue(mockEvent);
      mockParticipantValidationService.validateParticipantId.mockImplementation((participantId: string, _paymentType: string) => {
        if (participantId === '999') {
          throw new BadRequestException('Invalid participant');
        }
      });

      const invalidDto: CreateTransactionDto = {
        ...createDto,
        participantId: '999',
      };

      await expect(service.create('event-uuid-1', invalidDto, memberActor)).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    const updateDto = {
      title: 'Updated Transaction',
      amount: 150,
    };

    it('updates a transaction for admin actor', async () => {
      const updatedTransaction = {
        ...mockTransaction,
        title: 'Updated Transaction',
        amount: 150,
      };

      mockTransactionRepository.findOne
        .mockResolvedValueOnce(mockTransaction)
        .mockResolvedValueOnce(updatedTransaction);
      mockTransactionRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.update('transaction-uuid-1', updateDto, adminActor);

      expect(mockTransactionRepository.update).toHaveBeenCalledWith('transaction-uuid-1', updateDto);
      expect(result).toMatchObject({ title: 'Updated Transaction', amount: 150 });
    });

    it('validates participantId when updating', async () => {
      mockTransactionRepository.findOne.mockResolvedValue(mockTransaction);
      mockEventRepository.findOne.mockResolvedValue(mockEvent);
      mockParticipantValidationService.validateParticipantId.mockImplementation((participantId: string, _paymentType: string) => {
        if (participantId === '999') {
          throw new BadRequestException('Invalid participant');
        }
      });

      const updateDtoWithInvalidParticipant = {
        ...updateDto,
        participantId: '999',
      };

      await expect(service.update('transaction-uuid-1', updateDtoWithInvalidParticipant, adminActor)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('validates paymentType change against existing participantId', async () => {
      const potTransaction = { ...mockTransaction, participantId: '0', paymentType: 'expense' as const };
      mockTransactionRepository.findOne.mockResolvedValue(potTransaction);
      mockEventRepository.findOne.mockResolvedValue(mockEvent);
      mockParticipantValidationService.validateParticipantId.mockImplementation((participantId: string, paymentType: string) => {
        if (participantId === '0' && paymentType !== 'expense') {
          throw new BadRequestException(`POT participant can only be used with payment type 'expense'`);
        }
      });

      await expect(
        service.update('transaction-uuid-1', { paymentType: 'compensation' as const }, adminActor),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when transaction does not exist', async () => {
      mockTransactionRepository.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent-id', updateDto, adminActor)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes a transaction', async () => {
      mockTransactionRepository.findOne.mockResolvedValue(mockTransaction);
      mockTransactionRepository.softDelete.mockResolvedValue({ affected: 1 });

      await service.remove('transaction-uuid-1', adminActor);

      expect(mockTransactionRepository.findOne).toHaveBeenCalledWith({ where: { id: 'transaction-uuid-1' } });
      expect(mockTransactionRepository.softDelete).toHaveBeenCalledWith('transaction-uuid-1');
    });

    it('throws NotFoundException when transaction does not exist', async () => {
      mockTransactionRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent-id', adminActor)).rejects.toThrow(NotFoundException);
    });
  });
});
