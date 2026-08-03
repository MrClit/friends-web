import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { Event } from '../events/entities/event.entity';
import { ADMIN_ROLE } from '../users/user-role.constants';

/**
 * Single owner of the event access rule: an actor may access an event when it is an admin, or when it
 * is listed as a participant of type 'user' in the event.
 *
 * Every module that needs to authorize event access depends on this service instead of reimplementing
 * the rule against its own repository, so changing the rule means changing one place only.
 */
@Injectable()
export class EventAccessService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  isAdmin(actor: AuthenticatedUser): boolean {
    return actor.role === ADMIN_ROLE;
  }

  /**
   * Whether the actor is allowed to access the given event. Guest participants sharing the actor id
   * do not grant access: only participants of type 'user' are matched.
   */
  canAccessEvent(event: Event, actor: AuthenticatedUser): boolean {
    if (this.isAdmin(actor)) return true;
    return (event.participants ?? []).some((p) => p.type === 'user' && p.id === actor.id);
  }

  /**
   * Same rule as canAccessEvent, throwing instead of returning false.
   */
  ensureCanAccessEvent(event: Event, actor: AuthenticatedUser): void {
    if (!this.canAccessEvent(event, actor)) {
      throw new ForbiddenException(`Access to event ${event.id} is not allowed`);
    }
  }

  /**
   * Load an event without authorizing it. Callers that need to report a missing event as something
   * else (to avoid leaking its existence) use this instead of findEventOrThrow.
   */
  async findEvent(eventId: string): Promise<Event | null> {
    return this.eventRepository.findOne({ where: { id: eventId } });
  }

  async findEventOrThrow(eventId: string): Promise<Event> {
    const event = await this.findEvent(eventId);
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }
    return event;
  }

  /**
   * Load an event and authorize the actor against it in one step: 404 when it does not exist,
   * 403 when the actor cannot access it.
   */
  async loadAccessibleEvent(eventId: string, actor: AuthenticatedUser): Promise<Event> {
    const event = await this.findEventOrThrow(eventId);
    this.ensureCanAccessEvent(event, actor);
    return event;
  }
}
