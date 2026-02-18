import {
  Injectable,
  NotFoundException,
  Logger,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DeepPartial } from 'typeorm';
import { Event, EventParticipant } from './entities/event.entity';
import { User } from '../users/user.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { TransactionsService } from '../transactions/transactions.service';
import { EventKPIsService } from './services/event-kpis.service';
import { EventKPIsDto } from './dto/event-kpis.dto';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly transactionsService: TransactionsService,
    private readonly eventKPIsService: EventKPIsService,
  ) {}

  /**
   * Enrich user participants with name/email/avatar from users table
   * Works with one or multiple events, batching the database query
   * @param events - Event or array of events to enrich
   * @returns Enriched event(s) with user participant data
   */
  private async enrichParticipants(events: Event | Event[]): Promise<void> {
    const eventArray = Array.isArray(events) ? events : [events];
    if (eventArray.length === 0) return;

    try {
      // Collect all unique user participant IDs across all events
      const allUserIds = new Set<string>();
      for (const event of eventArray) {
        const participants: EventParticipant[] = event.participants ?? [];
        for (const p of participants) {
          if (p.type === 'user' && typeof p.id === 'string') {
            allUserIds.add(p.id);
          }
        }
      }

      // If no user participants, nothing to enrich
      if (allUserIds.size === 0) return;

      // Fetch all users in a single batch query
      const users = await this.userRepository.find({ where: { id: In(Array.from(allUserIds)) } });
      const usersById = new Map(users.map((u) => [u.id, u]));

      // Enrich each event's participants
      for (const event of eventArray) {
        event.participants = (event.participants ?? []).map((p) => {
          if (p.type === 'user' && typeof p.id === 'string') {
            const u = usersById.get(p.id);
            return {
              ...p,
              name: u?.name ?? null,
              email: u?.email ?? null,
              avatar: u?.avatar ?? null,
            } as EventParticipant;
          }
          return p;
        });
      }
    } catch (err) {
      this.logger.warn(`Failed to enrich participants: ${(err as Error).message}`);
    }
  }

  /**
   * Normalize and validate participants array
   * - Removes extra properties (name, email from user participants)
   * - Validates required fields by type
   * - Returns clean EventParticipant[] ready for storage
   * @param rawParticipants - Raw participants from DTO
   * @param allowEmpty - If false (create), requires at least 1 participant. If true (update), can be empty to skip update.
   * @returns Normalized participants or undefined if rawParticipants is undefined/empty and allowEmpty is true
   * @throws BadRequestException if validation fails
   */
  private normalizeParticipants(
    rawParticipants: unknown[] | undefined,
    allowEmpty: boolean = false,
  ): EventParticipant[] | undefined {
    // If no participants provided and allowEmpty, return undefined (skip update)
    if (!rawParticipants) {
      if (allowEmpty) return undefined;
      throw new BadRequestException('participants must be a non-empty array');
    }

    if (!Array.isArray(rawParticipants)) {
      throw new BadRequestException('participants must be an array');
    }

    if (rawParticipants.length === 0) {
      if (allowEmpty) return undefined;
      throw new BadRequestException('participants must be a non-empty array');
    }

    const isPlainObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

    const normalized = rawParticipants.map((p: unknown, idx: number): EventParticipant => {
      if (!isPlainObject(p) || typeof p['type'] !== 'string') {
        throw new BadRequestException(`participants[${idx}].type is required`);
      }

      const type = String(p['type']);
      switch (type) {
        case 'user': {
          if (typeof p['id'] !== 'string' || !p['id'].trim()) {
            throw new BadRequestException(`participants[${idx}].id is required for user participant`);
          }
          return { type: 'user', id: p['id'] };
        }
        case 'guest': {
          if (typeof p['id'] !== 'string' || !p['id'].trim()) {
            throw new BadRequestException(`participants[${idx}].id is required for guest participant`);
          }
          if (typeof p['name'] !== 'string' || !p['name'].trim()) {
            throw new BadRequestException(`participants[${idx}].name is required for guest participant`);
          }
          return { type: 'guest', id: p['id'], name: p['name'] };
        }
        case 'pot': {
          return { type: 'pot', id: '0' };
        }
        default:
          throw new BadRequestException(`participants[${idx}].type must be one of 'user'|'guest'|'pot'`);
      }
    });

    return normalized;
  }

  /**
   * Get all events ordered by creation date (newest first)
   * Enriches user participants with name/email/avatar from users table
   */
  async findAll(): Promise<Event[]> {
    try {
      this.logger.log('Fetching all events');
      const events = await this.eventRepository.find({
        order: {
          createdAt: 'DESC',
        },
      });

      // Enrich all events' participants in one batch
      await this.enrichParticipants(events);

      return events;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to fetch events: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Failed to fetch events');
    }
  }

  /**
   * Get a single event by ID
   * Enriches user participants with name/email/avatar from users table
   */
  async findOne(id: string): Promise<Event> {
    try {
      this.logger.log(`Fetching event with ID: ${id}`);
      const event = await this.eventRepository.findOne({
        where: { id },
      });

      if (!event) {
        throw new NotFoundException(`Event with ID ${id} not found`);
      }

      // Enrich participants
      await this.enrichParticipants(event);

      return event;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const err = error as Error;
      this.logger.error(`Failed to fetch event ${id}: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Failed to fetch event');
    }
  }

  /**
   * Create a new event
   */
  async create(createEventDto: CreateEventDto): Promise<Event> {
    try {
      this.logger.log(`Creating new event: ${createEventDto.title}`);

      // Normalize participants (required for create, allowEmpty = false)
      const rawParticipants = (createEventDto as unknown as { participants?: unknown[] }).participants;
      const participantsTyped = this.normalizeParticipants(rawParticipants, false);

      // Create a clean event object without spreading to avoid TypeORM confusion with extra properties
      const event = this.eventRepository.create({
        title: createEventDto.title,
        description: createEventDto.description,
        icon: createEventDto.icon,
        participants: participantsTyped,
      } as DeepPartial<Event>);

      const savedEvent = await this.eventRepository.save(event);
      this.logger.log(`Event created successfully with ID: ${savedEvent.id}`);
      return savedEvent;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to create event: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Failed to create event');
    }
  }

  /**
   * Update an existing event
   */
  async update(id: string, updateEventDto: UpdateEventDto): Promise<Event> {
    try {
      this.logger.log(`Updating event with ID: ${id}`);

      // Verify event exists
      const event = await this.findOne(id);

      // Normalize participants if provided (allowEmpty = true for optional update)
      const rawParticipants = (updateEventDto as unknown as { participants?: unknown[] }).participants;
      const normalizedParticipants = this.normalizeParticipants(rawParticipants, true);

      // Create clean update object without spreading to avoid TypeORM confusion
      const cleanUpdate: DeepPartial<Event> = {};
      if (updateEventDto.title !== undefined) cleanUpdate.title = updateEventDto.title;
      if (updateEventDto.description !== undefined) cleanUpdate.description = updateEventDto.description;
      if (updateEventDto.icon !== undefined) cleanUpdate.icon = updateEventDto.icon;
      if (normalizedParticipants !== undefined) cleanUpdate.participants = normalizedParticipants;

      const updatedEvent = this.eventRepository.merge(event, cleanUpdate);
      const savedEvent = await this.eventRepository.save(updatedEvent);

      this.logger.log(`Event ${id} updated successfully`);
      return savedEvent;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const err = error as Error;
      this.logger.error(`Failed to update event ${id}: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Failed to update event');
    }
  }

  /**
   * Delete an event (cascade deletes transactions)
   */
  async remove(id: string): Promise<void> {
    try {
      this.logger.log(`Deleting event with ID: ${id}`);

      // Verify event exists
      await this.findOne(id);

      // Delete event (cascade will delete related transactions)
      await this.eventRepository.delete(id);

      this.logger.log(`Event ${id} deleted successfully`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const err = error as Error;
      this.logger.error(`Failed to delete event ${id}: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Failed to delete event');
    }
  }

  /**
   * Get KPIs for a specific event
   */
  async getKPIs(eventId: string): Promise<EventKPIsDto> {
    return this.eventKPIsService.getKPIs(eventId);
  }
}
