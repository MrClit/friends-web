import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventAccessService } from './event-access.service';
import { Event, EventParticipant, EventStatus } from '../events/entities/event.entity';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';

const adminActor: AuthenticatedUser = { id: 'admin-1', email: 'admin@example.com', role: 'admin' };
const memberActor: AuthenticatedUser = { id: 'user-1', email: 'user-1@example.com', role: 'user' };
const outsiderActor: AuthenticatedUser = { id: 'user-2', email: 'user-2@example.com', role: 'user' };

const makeEvent = (participants: EventParticipant[] | undefined): Event =>
  ({
    id: 'event-1',
    title: 'Test Event',
    status: EventStatus.ACTIVE,
    participants,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  }) as Event;

describe('EventAccessService', () => {
  let service: EventAccessService;
  let eventRepository: { findOne: jest.Mock };

  beforeEach(async () => {
    eventRepository = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [EventAccessService, { provide: getRepositoryToken(Event), useValue: eventRepository }],
    }).compile();

    service = module.get<EventAccessService>(EventAccessService);
  });

  describe('isAdmin', () => {
    it('is true only for the admin role', () => {
      expect(service.isAdmin(adminActor)).toBe(true);
      expect(service.isAdmin(memberActor)).toBe(false);
    });
  });

  describe('canAccessEvent', () => {
    it('allows an admin regardless of participation', () => {
      expect(service.canAccessEvent(makeEvent([]), adminActor)).toBe(true);
    });

    it('allows a user participant of the event', () => {
      const event = makeEvent([{ type: 'user', id: memberActor.id }]);

      expect(service.canAccessEvent(event, memberActor)).toBe(true);
    });

    it('denies a user that is not a participant', () => {
      const event = makeEvent([{ type: 'user', id: memberActor.id }]);

      expect(service.canAccessEvent(event, outsiderActor)).toBe(false);
    });

    it('does not count a guest participant sharing the actor id', () => {
      const event = makeEvent([{ type: 'guest', id: memberActor.id, name: 'Guest' }]);

      expect(service.canAccessEvent(event, memberActor)).toBe(false);
    });

    it('denies a user when the event has no participants', () => {
      expect(service.canAccessEvent(makeEvent(undefined), memberActor)).toBe(false);
      expect(service.canAccessEvent(makeEvent([]), memberActor)).toBe(false);
    });
  });

  describe('ensureCanAccessEvent', () => {
    it('returns silently when access is allowed', () => {
      const event = makeEvent([{ type: 'user', id: memberActor.id }]);

      expect(() => service.ensureCanAccessEvent(event, memberActor)).not.toThrow();
    });

    it('throws ForbiddenException naming the event when access is denied', () => {
      const event = makeEvent([{ type: 'user', id: memberActor.id }]);

      expect(() => service.ensureCanAccessEvent(event, outsiderActor)).toThrow(ForbiddenException);
      expect(() => service.ensureCanAccessEvent(event, outsiderActor)).toThrow(
        `Access to event ${event.id} is not allowed`,
      );
    });
  });

  describe('findEvent', () => {
    it('returns null instead of throwing when the event does not exist', async () => {
      eventRepository.findOne.mockResolvedValue(null);

      await expect(service.findEvent('missing-id')).resolves.toBeNull();
      expect(eventRepository.findOne).toHaveBeenCalledWith({ where: { id: 'missing-id' } });
    });
  });

  describe('findEventOrThrow', () => {
    it('returns the event when it exists', async () => {
      const event = makeEvent([]);
      eventRepository.findOne.mockResolvedValue(event);

      await expect(service.findEventOrThrow(event.id)).resolves.toBe(event);
    });

    it('throws NotFoundException when the event does not exist', async () => {
      eventRepository.findOne.mockResolvedValue(null);

      await expect(service.findEventOrThrow('missing-id')).rejects.toThrow(NotFoundException);
      await expect(service.findEventOrThrow('missing-id')).rejects.toThrow('Event with ID missing-id not found');
    });
  });

  describe('loadAccessibleEvent', () => {
    it('returns the event when the actor can access it', async () => {
      const event = makeEvent([{ type: 'user', id: memberActor.id }]);
      eventRepository.findOne.mockResolvedValue(event);

      await expect(service.loadAccessibleEvent(event.id, memberActor)).resolves.toBe(event);
    });

    it('throws NotFoundException before authorizing when the event does not exist', async () => {
      eventRepository.findOne.mockResolvedValue(null);

      await expect(service.loadAccessibleEvent('missing-id', outsiderActor)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when the actor cannot access the event', async () => {
      const event = makeEvent([{ type: 'user', id: memberActor.id }]);
      eventRepository.findOne.mockResolvedValue(event);

      await expect(service.loadAccessibleEvent(event.id, outsiderActor)).rejects.toThrow(ForbiddenException);
    });
  });
});
