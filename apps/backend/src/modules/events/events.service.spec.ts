import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { EventsService } from './events.service';
import { Event } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

describe('EventsService', () => {
  let service: EventsService;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    merge: jest.fn(),
    delete: jest.fn(),
  };

  const mockEvent: Event = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Test Event',
    participants: [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
    ],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: getRepositoryToken(Event),
          useValue: mockRepository,
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
        participants: [{ id: '1', name: 'Alice' }],
      };

      mockRepository.create.mockReturnValue(mockEvent);
      mockRepository.save.mockResolvedValue(mockEvent);

      const result = await service.create(createDto);

      expect(result).toEqual(mockEvent);
      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockRepository.save).toHaveBeenCalledWith(mockEvent);
    });

    it('should throw InternalServerErrorException on save error', async () => {
      const createDto: CreateEventDto = {
        title: 'New Event',
        participants: [{ id: '1', name: 'Alice' }],
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
          { id: '1', name: 'Alice' },
          { id: '3', name: 'Charlie' },
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
});
