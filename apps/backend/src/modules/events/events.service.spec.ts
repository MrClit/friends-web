import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { EventsService } from './events.service';
import { Event } from './entities/event.entity';
import { EventStatus } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { TransactionsService } from '../transactions/transactions.service';
import { EventKPIsService } from './services/event-kpis.service';
import { User } from '../users/user.entity';

describe('EventsService', () => {
  let service: EventsService;

  let mockRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    merge: jest.Mock;
    delete: jest.Mock;
  };
  let mockTransactionsService: { findByEvent: jest.Mock };
  let mockEventKPIsService: { getKPIs: jest.Mock };
  let mockUserRepository: { find: jest.Mock };

  const mockEvent: Event = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Test Event',
    description: '',
    icon: '',
    status: EventStatus.ACTIVE,
    participants: [
      { type: 'guest', id: '1', name: 'Alice' },
      { type: 'guest', id: '2', name: 'Bob' },
    ],
    transactions: [],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeEach(async () => {
    // create fresh mocks for each test to avoid shared state
    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      merge: jest.fn(),
      delete: jest.fn(),
    };

    mockTransactionsService = {
      findByEvent: jest.fn(),
    };

    mockEventKPIsService = {
      getKPIs: jest.fn(),
    };

    mockUserRepository = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: getRepositoryToken(Event),
          useValue: mockRepository as unknown as Repository<Event>,
        },
        {
          provide: TransactionsService,
          useValue: mockTransactionsService as unknown as TransactionsService,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository as unknown as Repository<User>,
        },
        {
          provide: EventKPIsService,
          useValue: mockEventKPIsService as unknown as EventKPIsService,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);

    // Clear mock calls before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of events', async () => {
      const events = [mockEvent];
      mockRepository.find.mockResolvedValue(events);

      const result = await service.findAll();

      expect(result).toEqual(events);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { status: 'active' },
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array when no events exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(mockRepository.find).toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException on database error', async () => {
      mockRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(service.findAll()).rejects.toThrow(InternalServerErrorException);
      await expect(service.findAll()).rejects.toThrow('Failed to fetch events');
    });
  });

  describe('findOne', () => {
    it('should return an event when found', async () => {
      mockRepository.findOne.mockResolvedValue(mockEvent);

      const result = await service.findOne(mockEvent.id);

      expect(result).toEqual(mockEvent);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockEvent.id },
      });
    });

    it('should throw NotFoundException when event not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('non-existent-id')).rejects.toThrow('Event with ID non-existent-id not found');
    });

    it('should throw InternalServerErrorException on database error', async () => {
      mockRepository.findOne.mockRejectedValue(new Error('Database error'));

      await expect(service.findOne(mockEvent.id)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('create', () => {
    it('should create and return a new event', async () => {
      const createDto: CreateEventDto = {
        title: 'New Event',
        participants: [{ type: 'guest', id: '1', name: 'Alice' }],
      };

      mockRepository.create.mockReturnValue(mockEvent);
      mockRepository.save.mockResolvedValue(mockEvent);

      const result = await service.create(createDto);

      expect(result).toEqual(mockEvent);
      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockRepository.save).toHaveBeenCalledWith(mockEvent);
    });

    it('should call create then save exactly once during create', async () => {
      const createDto: CreateEventDto = {
        title: 'New Event',
        participants: [{ type: 'guest', id: '1', name: 'Alice' }],
      };

      mockRepository.create.mockReturnValue(mockEvent);
      mockRepository.save.mockResolvedValue(mockEvent);

      await service.create(createDto);

      const createOrder = mockRepository.create.mock.invocationCallOrder[0];
      const saveOrder = mockRepository.save.mock.invocationCallOrder[0];

      expect(createOrder).toBeLessThan(saveOrder);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should throw InternalServerErrorException on save error', async () => {
      const createDto: CreateEventDto = {
        title: 'New Event',
        participants: [{ type: 'guest', id: '1', name: 'Alice' }],
      };

      mockRepository.create.mockReturnValue(mockEvent);
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.create(createDto)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('update', () => {
    it('should update and return the updated event', async () => {
      const updateDto: UpdateEventDto = {
        title: 'Updated Event',
      };

      const updatedEvent = { ...mockEvent, ...updateDto };

      mockRepository.findOne.mockResolvedValue(mockEvent);
      mockRepository.merge.mockReturnValue(updatedEvent);
      mockRepository.save.mockResolvedValue(updatedEvent);

      const result = await service.update(mockEvent.id, updateDto);

      expect(result).toEqual(updatedEvent);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockEvent.id },
      });
      expect(mockRepository.merge).toHaveBeenCalledWith(mockEvent, updateDto);
      expect(mockRepository.save).toHaveBeenCalledWith(updatedEvent);
    });

    it('should call save exactly once during update', async () => {
      const updateDto: UpdateEventDto = {
        title: 'Updated Event',
      };

      const updatedEvent = { ...mockEvent, ...updateDto };

      mockRepository.findOne.mockResolvedValue(mockEvent);
      mockRepository.merge.mockReturnValue(updatedEvent);
      mockRepository.save.mockResolvedValue(updatedEvent);

      await service.update(mockEvent.id, updateDto);

      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should call findOne exactly once during update', async () => {
      const updateDto: UpdateEventDto = {
        title: 'Updated Event',
      };

      const updatedEvent = { ...mockEvent, ...updateDto };

      mockRepository.findOne.mockResolvedValue(mockEvent);
      mockRepository.merge.mockReturnValue(updatedEvent);
      mockRepository.save.mockResolvedValue(updatedEvent);

      await service.update(mockEvent.id, updateDto);

      expect(mockRepository.findOne).toHaveBeenCalledTimes(1);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockEvent.id },
      });
    });

    it('should throw NotFoundException when event not found', async () => {
      const updateDto: UpdateEventDto = {
        title: 'Updated Event',
      };

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update('non-existent-id', updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should update participants when provided', async () => {
      const updateDto: UpdateEventDto = {
        participants: [
          { type: 'guest', id: '1', name: 'Alice' },
          { type: 'guest', id: '3', name: 'Charlie' },
        ],
      };

      const updatedEvent = { ...mockEvent, ...updateDto };

      mockRepository.findOne.mockResolvedValue(mockEvent);
      mockRepository.merge.mockReturnValue(updatedEvent);
      mockRepository.save.mockResolvedValue(updatedEvent);

      const result = await service.update(mockEvent.id, updateDto);

      expect(result.participants).toEqual(updateDto.participants);
    });

    it('should throw InternalServerErrorException on save error', async () => {
      const updateDto: UpdateEventDto = {
        title: 'Updated Event',
      };

      mockRepository.findOne.mockResolvedValue(mockEvent);
      mockRepository.merge.mockReturnValue(mockEvent);
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.update(mockEvent.id, updateDto)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('remove', () => {
    it('should delete an event successfully', async () => {
      mockRepository.findOne.mockResolvedValue(mockEvent);
      mockRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      await service.remove(mockEvent.id);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockEvent.id },
      });
      expect(mockRepository.delete).toHaveBeenCalledWith(mockEvent.id);
    });

    it('should throw NotFoundException when event not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(NotFoundException);
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException on delete error', async () => {
      mockRepository.findOne.mockResolvedValue(mockEvent);
      mockRepository.delete.mockRejectedValue(new Error('Database error'));

      await expect(service.remove(mockEvent.id)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getKPIs', () => {
    const expectedKPIs = {
      totalExpenses: 75.0,
      totalContributions: 150.0,
      totalCompensations: 0,
      potBalance: 75.0,
      pendingToCompensate: 75.0,
      participantBalances: { '1': 50.0, '2': 50.0 },
      participantContributions: { '1': 100.0, '2': 50.0 },
      participantExpenses: { '1': 50.0, '2': 0 },
      participantCompensations: { '1': 0, '2': 0 },
      participantPending: { '1': 50.0 },
      potExpenses: 25.0,
    };

    it('should calculate KPIs correctly', async () => {
      mockEventKPIsService.getKPIs.mockResolvedValue(expectedKPIs);

      const result = await service.getKPIs(mockEvent.id);

      expect(result).toEqual(expectedKPIs);
      expect(mockEventKPIsService.getKPIs).toHaveBeenCalledWith(mockEvent.id);
    });

    it('should throw NotFoundException when event not found', async () => {
      mockEventKPIsService.getKPIs.mockRejectedValue(new NotFoundException());

      await expect(service.getKPIs('non-existent-id')).rejects.toThrow(NotFoundException);
      expect(mockEventKPIsService.getKPIs).toHaveBeenCalledWith('non-existent-id');
    });

    it('should throw InternalServerErrorException on database error', async () => {
      mockEventKPIsService.getKPIs.mockRejectedValue(new InternalServerErrorException());

      await expect(service.getKPIs(mockEvent.id)).rejects.toThrow(InternalServerErrorException);
      expect(mockEventKPIsService.getKPIs).toHaveBeenCalledWith(mockEvent.id);
    });
  });
});
