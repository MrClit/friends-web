import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { EventsService } from './events.service';
import { Event, EventStatus } from './entities/event.entity';
import type { EventParticipant } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventKPIsService } from './services/event-kpis.service';
import { EventQueryService } from './services/event-query.service';
import { EventParticipantsService } from './services/event-participants.service';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';

describe('EventsService', () => {
  let service: EventsService;

  let mockRepository: {
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    merge: jest.Mock;
    delete: jest.Mock;
    manager: {
      transaction: jest.Mock;
    };
  };
  let mockTransactionalEventRepository: {
    findOne: jest.Mock;
    merge: jest.Mock;
    save: jest.Mock;
  };
  let mockEventQueryService: {
    findEventOrThrow: jest.Mock;
    calculateLastModified: jest.Mock;
  };
  let mockEventParticipantsService: {
    enrichParticipants: jest.Mock;
    normalizeParticipants: jest.Mock;
    validateParticipantReplacements: jest.Mock;
    applyParticipantReplacements: jest.Mock;
  };
  let mockEventKPIsService: { getKPIs: jest.Mock };

  const adminActor: AuthenticatedUser = {
    id: 'admin-1',
    email: 'admin@example.com',
    role: 'admin',
  };

  const memberActor: AuthenticatedUser = {
    id: 'member-1',
    email: 'member@example.com',
    role: 'user',
  };

  const outsiderActor: AuthenticatedUser = {
    id: 'outsider-1',
    email: 'outsider@example.com',
    role: 'user',
  };

  const mockEvent: Event = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Test Event',
    description: '',
    icon: '',
    status: EventStatus.ACTIVE,
    participants: [
      { type: 'user', id: memberActor.id },
      { type: 'guest', id: 'g1', name: 'Guest 1' },
    ],
    transactions: [],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeEach(async () => {
    mockRepository = {
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      merge: jest.fn(),
      delete: jest.fn(),
      manager: {
        transaction: jest.fn(),
      },
    };

    mockTransactionalEventRepository = {
      findOne: jest.fn(),
      merge: jest.fn(),
      save: jest.fn(),
    };

    mockRepository.manager.transaction.mockImplementation(async (callback: (manager: unknown) => Promise<unknown>) => {
      const manager = {
        getRepository: (entity: unknown) => {
          if (entity === Event) {
            return mockTransactionalEventRepository;
          }
          throw new Error('Unknown repository requested in test transaction manager');
        },
      };

      return callback(manager);
    });

    mockEventQueryService = {
      findEventOrThrow: jest.fn().mockResolvedValue(mockEvent),
      calculateLastModified: jest.fn().mockResolvedValue(undefined),
    };

    mockEventParticipantsService = {
      enrichParticipants: jest.fn().mockResolvedValue(undefined),
      normalizeParticipants: jest.fn().mockImplementation((raw: unknown) => raw as EventParticipant[]),
      validateParticipantReplacements: jest.fn().mockReturnValue([]),
      applyParticipantReplacements: jest.fn().mockResolvedValue(undefined),
    };

    mockEventKPIsService = {
      getKPIs: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: getRepositoryToken(Event),
          useValue: mockRepository as unknown as Repository<Event>,
        },
        {
          provide: EventQueryService,
          useValue: mockEventQueryService,
        },
        {
          provide: EventParticipantsService,
          useValue: mockEventParticipantsService,
        },
        {
          provide: EventKPIsService,
          useValue: mockEventKPIsService as unknown as EventKPIsService,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('returns all events for admin actor', async () => {
      const events = [mockEvent];
      mockRepository.find.mockResolvedValue(events);

      const result = await service.findAll(adminActor);

      expect(result).toEqual(events);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { status: 'active' },
        order: { createdAt: 'DESC' },
      });
    });

    it('filters events by membership for user actor', async () => {
      const ownEvent = { ...mockEvent };
      const foreignEvent = {
        ...mockEvent,
        id: 'foreign-event',
        participants: [{ type: 'user', id: outsiderActor.id }],
      } as Event;

      mockRepository.find.mockResolvedValue([ownEvent, foreignEvent]);

      const result = await service.findAll(memberActor);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(ownEvent.id);
    });

    it('throws InternalServerErrorException on repository error', async () => {
      mockRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(service.findAll(adminActor)).rejects.toThrow(InternalServerErrorException);
      await expect(service.findAll(adminActor)).rejects.toThrow('Failed to fetch events');
    });
  });

  describe('findOne', () => {
    it('returns event for admin actor', async () => {
      const result = await service.findOne(mockEvent.id, adminActor);

      expect(result).toEqual(mockEvent);
      expect(mockEventQueryService.findEventOrThrow).toHaveBeenCalledWith(mockEvent.id);
    });

    it('throws NotFoundException when event does not exist', async () => {
      mockEventQueryService.findEventOrThrow.mockRejectedValue(
        new NotFoundException(`Event with ID non-existent-id not found`),
      );

      await expect(service.findOne('non-existent-id', adminActor)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when user is not participant', async () => {
      await expect(service.findOne(mockEvent.id, outsiderActor)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates event for admin without mutating participants', async () => {
      const participants: EventParticipant[] = [{ type: 'guest', id: 'g-1', name: 'Guest One' }];
      const createDto: CreateEventDto = {
        title: 'Admin Event',
        participants,
      };

      const savedEvent = {
        ...mockEvent,
        title: createDto.title,
        participants,
      } as Event;

      mockRepository.create.mockReturnValue(savedEvent);
      mockRepository.save.mockResolvedValue(savedEvent);

      const result = await service.create(createDto, adminActor);

      expect(result).toEqual(savedEvent);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: createDto.title,
          participants,
        }),
      );
    });

    it('auto-adds creator user participant when missing', async () => {
      const participants: EventParticipant[] = [{ type: 'guest', id: 'g-2', name: 'Guest Two' }];
      const expectedParticipants: EventParticipant[] = [...participants, { type: 'user', id: memberActor.id }];
      const createDto: CreateEventDto = {
        title: 'User Event',
        participants,
      };

      const savedEvent = {
        ...mockEvent,
        title: createDto.title,
        participants: expectedParticipants,
      } as Event;

      mockRepository.create.mockReturnValue(savedEvent);
      mockRepository.save.mockResolvedValue(savedEvent);

      await service.create(createDto, memberActor);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          participants: expectedParticipants,
        }),
      );
    });

    it('throws InternalServerErrorException on save error', async () => {
      const createDto: CreateEventDto = {
        title: 'Error Event',
        participants: [{ type: 'guest', id: 'g-3', name: 'Guest Three' }],
      };

      mockRepository.create.mockReturnValue(mockEvent);
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.create(createDto, adminActor)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('update', () => {
    it('updates event for authorized actor', async () => {
      const updateDto: UpdateEventDto = { title: 'Updated Event' };
      const updatedEvent = { ...mockEvent, title: 'Updated Event' } as Event;

      mockRepository.merge.mockReturnValue(updatedEvent);
      mockRepository.save.mockResolvedValue(updatedEvent);

      const result = await service.update(mockEvent.id, updateDto, adminActor);

      expect(result).toEqual(updatedEvent);
      expect(mockRepository.merge).toHaveBeenCalledWith(mockEvent, { title: 'Updated Event' });
      expect(mockRepository.save).toHaveBeenCalledWith(updatedEvent);
    });

    it('throws NotFoundException when user is not participant', async () => {
      const updateDto: UpdateEventDto = { title: 'Blocked Update' };

      await expect(service.update(mockEvent.id, updateDto, outsiderActor)).rejects.toThrow(NotFoundException);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('migrates guest transactions when replacing guest with user', async () => {
      const updateDto: UpdateEventDto = {
        participants: [
          { type: 'user', id: memberActor.id },
          { type: 'user', id: 'new-user-id' },
        ],
        participantReplacements: [{ fromGuestId: 'g1', toUserId: 'new-user-id' }],
      };

      const updatedEvent = {
        ...mockEvent,
        participants: updateDto.participants,
      } as Event;

      mockTransactionalEventRepository.findOne.mockResolvedValue(mockEvent);
      mockTransactionalEventRepository.merge.mockReturnValue(updatedEvent);
      mockTransactionalEventRepository.save.mockResolvedValue(updatedEvent);
      mockEventParticipantsService.validateParticipantReplacements.mockReturnValue([
        { fromGuestId: 'g1', toUserId: 'new-user-id' },
      ]);

      const result = await service.update(mockEvent.id, updateDto, adminActor);

      expect(mockRepository.manager.transaction).toHaveBeenCalledTimes(1);
      expect(mockEventParticipantsService.applyParticipantReplacements).toHaveBeenCalledWith(
        expect.anything(),
        mockEvent.id,
        [{ fromGuestId: 'g1', toUserId: 'new-user-id' }],
      );
      expect(result).toEqual(updatedEvent);
    });

    it('throws BadRequestException when replacement target user already participates', async () => {
      const updateDto: UpdateEventDto = {
        participants: [{ type: 'user', id: memberActor.id }],
        participantReplacements: [{ fromGuestId: 'g1', toUserId: memberActor.id }],
      };

      mockEventParticipantsService.validateParticipantReplacements.mockImplementation(() => {
        throw new BadRequestException(
          `User ${memberActor.id} already participates in the event and cannot be used as replacement target`,
        );
      });

      await expect(service.update(mockEvent.id, updateDto, adminActor)).rejects.toThrow(BadRequestException);
      expect(mockRepository.manager.transaction).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes event for authorized actor', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      await service.remove(mockEvent.id, adminActor);

      expect(mockRepository.delete).toHaveBeenCalledWith(mockEvent.id);
    });

    it('throws NotFoundException when user is not participant', async () => {
      await expect(service.remove(mockEvent.id, outsiderActor)).rejects.toThrow(NotFoundException);
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('getKPIs', () => {
    const expectedKPIs = {
      totalExpenses: 75.0,
      totalContributions: 150.0,
      totalCompensations: 0,
      potBalance: 125.0,
      pendingToCompensate: 50.0,
      participantBalances: { '1': 50.0, '2': 50.0 },
      participantContributions: { '1': 100.0, '2': 50.0 },
      participantExpenses: { '1': 50.0, '2': 0 },
      participantCompensations: { '1': 0, '2': 0 },
      participantPending: { '1': 50.0, '2': 0 },
      potExpenses: 25.0,
      balanceBreakdown: {
        inflows: {
          total: 150.0,
          contributionsByParticipant: { '1': 100.0, '2': 50.0 },
        },
        outflows: {
          total: 25.0,
          compensationsTotal: 0,
          compensationsByParticipant: { '1': 0, '2': 0 },
          potExpensesTotal: 25.0,
          potExpensesTransactions: [
            {
              id: 'tx-pot-1',
              title: 'Shared expense',
              amount: 25.0,
              date: '2026-01-01',
            },
          ],
        },
        participantNetWithPot: { '1': 100.0, '2': 50.0 },
        reconciliation: {
          inflows: 150.0,
          outflows: 25.0,
          potBalance: 125.0,
          isConsistent: true,
        },
      },
    };

    it('returns KPIs when actor can access event', async () => {
      mockEventKPIsService.getKPIs.mockResolvedValue(expectedKPIs);

      const result = await service.getKPIs(mockEvent.id, memberActor);

      expect(result).toEqual(expectedKPIs);
      expect(mockEventKPIsService.getKPIs).toHaveBeenCalledWith(mockEvent.id, memberActor);
    });

    it('throws NotFoundException when actor cannot access event', async () => {
      await expect(service.getKPIs(mockEvent.id, outsiderActor)).rejects.toThrow(NotFoundException);
      expect(mockEventKPIsService.getKPIs).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when event does not exist', async () => {
      mockEventQueryService.findEventOrThrow.mockRejectedValue(
        new NotFoundException('Event with ID non-existent-id not found'),
      );

      await expect(service.getKPIs('non-existent-id', adminActor)).rejects.toThrow(NotFoundException);
      expect(mockEventKPIsService.getKPIs).not.toHaveBeenCalled();
    });

    it('throws InternalServerErrorException when KPI service fails', async () => {
      mockEventKPIsService.getKPIs.mockRejectedValue(new InternalServerErrorException());

      await expect(service.getKPIs(mockEvent.id, adminActor)).rejects.toThrow(InternalServerErrorException);
      expect(mockEventKPIsService.getKPIs).toHaveBeenCalledWith(mockEvent.id, adminActor);
    });
  });
});
