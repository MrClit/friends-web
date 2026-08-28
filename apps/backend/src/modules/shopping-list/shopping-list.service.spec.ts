import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { ShoppingListService } from './shopping-list.service';
import { ShoppingItem } from './entities/shopping-item.entity';
import { Event } from '../events/entities/event.entity';
import { EventAccessService } from '../event-access/event-access.service';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { RequestContextService } from '../../common/request-context/request-context.service';

describe('ShoppingListService', () => {
  let service: ShoppingListService;

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

  const otherMemberActor: AuthenticatedUser = {
    id: 'user-3',
    email: 'user-3@example.com',
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
      { type: 'user', id: otherMemberActor.id },
      { type: 'guest', id: 'g1', name: 'Guest 1' },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as Event;

  const buildItem = (overrides: Partial<ShoppingItem> = {}): ShoppingItem =>
    ({
      id: 'item-uuid-1',
      name: '2 cajas de cerveza',
      eventId: 'event-uuid-1',
      createdBy: memberActor.id,
      purchasedBy: null,
      purchasedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as unknown as ShoppingItem;

  const mockShoppingItemRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockEventRepository = {
    findOne: jest.fn(),
  };

  const loggerErrorSpy = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShoppingListService,
        {
          provide: getRepositoryToken(ShoppingItem),
          useValue: mockShoppingItemRepository,
        },
        // The real EventAccessService is wired over a mocked event repository so these tests keep
        // exercising the access rule itself, not just the delegation to it.
        EventAccessService,
        {
          provide: getRepositoryToken(Event),
          useValue: mockEventRepository,
        },
        {
          provide: RequestContextService,
          useValue: { correlationId: 'test-correlation-id' },
        },
      ],
    }).compile();

    service = module.get<ShoppingListService>(ShoppingListService);
    jest.spyOn(service['logger'], 'error').mockImplementation(loggerErrorSpy);
    jest.spyOn(service['logger'], 'log').mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByEvent', () => {
    it('returns the items of the event in insertion order', async () => {
      const items = [buildItem(), buildItem()];
      mockEventRepository.findOne.mockResolvedValue(mockEvent);
      mockShoppingItemRepository.find.mockResolvedValue(items);

      const result = await service.findByEvent('event-uuid-1', memberActor);

      expect(result).toEqual(items);
      expect(mockShoppingItemRepository.find).toHaveBeenCalledWith({
        where: { eventId: 'event-uuid-1' },
        order: { createdAt: 'ASC' },
      });
    });

    it('allows an admin that does not participate in the event', async () => {
      mockEventRepository.findOne.mockResolvedValue(mockEvent);
      mockShoppingItemRepository.find.mockResolvedValue([]);

      await expect(service.findByEvent('event-uuid-1', adminActor)).resolves.toEqual([]);
    });

    it('throws NotFoundException when the event does not exist', async () => {
      mockEventRepository.findOne.mockResolvedValue(null);

      await expect(service.findByEvent('missing-event', memberActor)).rejects.toThrow(NotFoundException);
      expect(mockShoppingItemRepository.find).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when the actor does not participate in the event', async () => {
      mockEventRepository.findOne.mockResolvedValue(mockEvent);

      await expect(service.findByEvent('event-uuid-1', outsiderActor)).rejects.toThrow(ForbiddenException);
      expect(mockShoppingItemRepository.find).not.toHaveBeenCalled();
    });

    it('maps an unexpected repository failure to InternalServerErrorException and logs it', async () => {
      mockEventRepository.findOne.mockResolvedValue(mockEvent);
      mockShoppingItemRepository.find.mockRejectedValue(new Error('connection lost'));

      await expect(service.findByEvent('event-uuid-1', memberActor)).rejects.toThrow(InternalServerErrorException);
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          correlationId: 'test-correlation-id',
          actorId: memberActor.id,
          eventId: 'event-uuid-1',
        }),
        expect.anything(),
      );
    });
  });

  describe('create', () => {
    it('persists the item with the actor as creator and no purchase attribution', async () => {
      const created = buildItem();
      mockEventRepository.findOne.mockResolvedValue(mockEvent);
      mockShoppingItemRepository.create.mockReturnValue(created);
      mockShoppingItemRepository.save.mockResolvedValue(created);

      const result = await service.create('event-uuid-1', { name: '2 cajas de cerveza' }, memberActor);

      expect(mockShoppingItemRepository.create).toHaveBeenCalledWith({
        name: '2 cajas de cerveza',
        eventId: 'event-uuid-1',
        createdBy: memberActor.id,
      });
      expect(result).toBe(created);
    });

    it('throws NotFoundException when the event does not exist', async () => {
      mockEventRepository.findOne.mockResolvedValue(null);

      await expect(service.create('missing-event', { name: 'Pan' }, memberActor)).rejects.toThrow(NotFoundException);
      expect(mockShoppingItemRepository.save).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException for an actor without access to the event', async () => {
      mockEventRepository.findOne.mockResolvedValue(mockEvent);

      await expect(service.create('event-uuid-1', { name: 'Pan' }, outsiderActor)).rejects.toThrow(ForbiddenException);
      expect(mockShoppingItemRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('renames an item created by somebody else', async () => {
      const item = buildItem();
      mockShoppingItemRepository.findOne.mockResolvedValue(item);
      mockEventRepository.findOne.mockResolvedValue(mockEvent);
      mockShoppingItemRepository.update.mockResolvedValue({ affected: 1 });

      await service.update('item-uuid-1', { name: '3 cajas de cerveza' }, otherMemberActor);

      expect(mockShoppingItemRepository.update).toHaveBeenCalledWith('item-uuid-1', {
        name: '3 cajas de cerveza',
      });
    });

    it('writes the purchase attribution when marking a pending item as purchased', async () => {
      const item = buildItem();
      mockShoppingItemRepository.findOne.mockResolvedValue(item);
      mockEventRepository.findOne.mockResolvedValue(mockEvent);
      mockShoppingItemRepository.update.mockResolvedValue({ affected: 1 });

      await service.update('item-uuid-1', { purchased: true }, memberActor);

      expect(mockShoppingItemRepository.update).toHaveBeenCalledWith('item-uuid-1', {
        purchasedAt: expect.any(Date) as Date,
        purchasedBy: memberActor.id,
      });
    });

    it('keeps the original buyer when an already purchased item is marked again', async () => {
      const purchasedAt = new Date('2026-08-01T10:00:00.000Z');
      const item = buildItem();
      item.purchasedAt = purchasedAt;
      item.purchasedBy = memberActor.id;
      mockShoppingItemRepository.findOne.mockResolvedValue(item);
      mockEventRepository.findOne.mockResolvedValue(mockEvent);

      await service.update('item-uuid-1', { purchased: true }, otherMemberActor);

      expect(mockShoppingItemRepository.update).not.toHaveBeenCalled();
    });

    it('clears the purchase attribution when unmarking an item', async () => {
      const item = buildItem();
      item.purchasedAt = new Date();
      item.purchasedBy = memberActor.id;
      mockShoppingItemRepository.findOne.mockResolvedValue(item);
      mockEventRepository.findOne.mockResolvedValue(mockEvent);
      mockShoppingItemRepository.update.mockResolvedValue({ affected: 1 });

      await service.update('item-uuid-1', { purchased: false }, otherMemberActor);

      expect(mockShoppingItemRepository.update).toHaveBeenCalledWith('item-uuid-1', {
        purchasedAt: null,
        purchasedBy: null,
      });
    });

    it('applies a rename and a purchase in the same call', async () => {
      const item = buildItem();
      mockShoppingItemRepository.findOne.mockResolvedValue(item);
      mockEventRepository.findOne.mockResolvedValue(mockEvent);
      mockShoppingItemRepository.update.mockResolvedValue({ affected: 1 });

      await service.update('item-uuid-1', { name: 'Hielo', purchased: true }, memberActor);

      expect(mockShoppingItemRepository.update).toHaveBeenCalledWith('item-uuid-1', {
        name: 'Hielo',
        purchasedAt: expect.any(Date) as Date,
        purchasedBy: memberActor.id,
      });
    });

    it('does not touch the row when the payload is empty', async () => {
      const item = buildItem();
      mockShoppingItemRepository.findOne.mockResolvedValue(item);
      mockEventRepository.findOne.mockResolvedValue(mockEvent);

      const result = await service.update('item-uuid-1', {}, memberActor);

      expect(mockShoppingItemRepository.update).not.toHaveBeenCalled();
      expect(result).toBe(item);
    });

    it('throws NotFoundException when the item does not exist', async () => {
      mockShoppingItemRepository.findOne.mockResolvedValue(null);

      await expect(service.update('missing-item', { name: 'Pan' }, memberActor)).rejects.toThrow(NotFoundException);
    });

    it('reports a missing parent event as a missing item, never as forbidden', async () => {
      mockShoppingItemRepository.findOne.mockResolvedValue(buildItem());
      mockEventRepository.findOne.mockResolvedValue(null);

      await expect(service.update('item-uuid-1', { name: 'Pan' }, memberActor)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException for an actor without access to the parent event', async () => {
      mockShoppingItemRepository.findOne.mockResolvedValue(buildItem());
      mockEventRepository.findOne.mockResolvedValue(mockEvent);

      await expect(service.update('item-uuid-1', { name: 'Pan' }, outsiderActor)).rejects.toThrow(ForbiddenException);
      expect(mockShoppingItemRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('hard deletes the item', async () => {
      mockShoppingItemRepository.findOne.mockResolvedValue(buildItem());
      mockEventRepository.findOne.mockResolvedValue(mockEvent);
      mockShoppingItemRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove('item-uuid-1', otherMemberActor);

      expect(mockShoppingItemRepository.delete).toHaveBeenCalledWith('item-uuid-1');
      expect(mockShoppingItemRepository.softDelete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the item does not exist', async () => {
      mockShoppingItemRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('missing-item', memberActor)).rejects.toThrow(NotFoundException);
      expect(mockShoppingItemRepository.delete).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException for an actor without access to the parent event', async () => {
      mockShoppingItemRepository.findOne.mockResolvedValue(buildItem());
      mockEventRepository.findOne.mockResolvedValue(mockEvent);

      await expect(service.remove('item-uuid-1', outsiderActor)).rejects.toThrow(ForbiddenException);
      expect(mockShoppingItemRepository.delete).not.toHaveBeenCalled();
    });

    it('maps an unexpected repository failure to InternalServerErrorException', async () => {
      mockShoppingItemRepository.findOne.mockResolvedValue(buildItem());
      mockEventRepository.findOne.mockResolvedValue(mockEvent);
      mockShoppingItemRepository.delete.mockRejectedValue(new Error('connection lost'));

      await expect(service.remove('item-uuid-1', memberActor)).rejects.toThrow(InternalServerErrorException);
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.objectContaining({ itemId: 'item-uuid-1', actorId: memberActor.id }),
        expect.anything(),
      );
    });
  });
});
