import {
  Injectable,
  NotFoundException,
  Logger,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { Event, EventParticipant, EventStatus } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { ParticipantReplacementDto } from './dto/participant-replacement.dto';
import { EventKPIsService } from './services/event-kpis.service';
import { EventQueryService } from './services/event-query.service';
import { EventParticipantsService } from './services/event-participants.service';
import { EventKPIsDto } from './dto/event-kpis.dto';
import { ADMIN_ROLE } from '../users/user-role.constants';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    private readonly eventQueryService: EventQueryService,
    private readonly eventParticipantsService: EventParticipantsService,
    private readonly eventKPIsService: EventKPIsService,
  ) {}

  private buildCleanEventUpdate(
    updateEventDto: UpdateEventDto,
    normalizedParticipants: EventParticipant[] | undefined,
  ): DeepPartial<Event> {
    const cleanUpdate: DeepPartial<Event> = {};

    if (updateEventDto.title !== undefined) cleanUpdate.title = updateEventDto.title;
    if (updateEventDto.description !== undefined) cleanUpdate.description = updateEventDto.description;
    if (updateEventDto.icon !== undefined) cleanUpdate.icon = updateEventDto.icon;
    if (updateEventDto.status !== undefined) cleanUpdate.status = updateEventDto.status;
    if (normalizedParticipants !== undefined) cleanUpdate.participants = normalizedParticipants;

    return cleanUpdate;
  }

  private isAdmin(actor: AuthenticatedUser): boolean {
    return actor.role === ADMIN_ROLE;
  }

  private isUserParticipant(event: Event, userId: string): boolean {
    return (event.participants ?? []).some((p) => p.type === 'user' && p.id === userId);
  }

  private ensureCanAccessEvent(event: Event, actor: AuthenticatedUser): void {
    if (this.isAdmin(actor)) return;
    if (!this.isUserParticipant(event, actor.id)) {
      throw new NotFoundException(`Event with ID ${event.id} not found`);
    }
  }

  private ensureActorParticipant(participants: EventParticipant[], actor: AuthenticatedUser): EventParticipant[] {
    if (this.isAdmin(actor)) return participants;
    const hasCurrentUser = participants.some((p) => p.type === 'user' && p.id === actor.id);
    return hasCurrentUser ? participants : [...participants, { type: 'user', id: actor.id }];
  }

  /**
   * Get all events ordered by creation date (newest first).
   * Enriches user participants and calculates lastModified.
   * @param status - Optional filter by status (active/archived), defaults to 'active'
   */
  async findAll(actor: AuthenticatedUser, status?: EventStatus): Promise<Event[]> {
    try {
      this.logger.log('Fetching all events');

      const whereCondition = status ? { status } : { status: EventStatus.ACTIVE };
      let events = await this.eventRepository.find({
        where: whereCondition,
        order: { createdAt: 'DESC' },
      });

      if (!this.isAdmin(actor)) {
        events = events.filter((event) => this.isUserParticipant(event, actor.id));
      }

      await this.eventParticipantsService.enrichParticipants(events);
      await this.eventQueryService.calculateLastModified(events);

      return events;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to fetch events: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Failed to fetch events');
    }
  }

  /**
   * Get a single event by ID.
   * Enriches user participants and calculates lastModified.
   */
  async findOne(id: string, actor: AuthenticatedUser): Promise<Event> {
    try {
      this.logger.log(`Fetching event with ID: ${id}`);
      const event = await this.eventQueryService.findEventOrThrow(id);
      this.ensureCanAccessEvent(event, actor);

      await this.eventParticipantsService.enrichParticipants(event);
      await this.eventQueryService.calculateLastModified(event);

      return event;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const err = error as Error;
      this.logger.error(`Failed to fetch event ${id}: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Failed to fetch event');
    }
  }

  /**
   * Create a new event.
   */
  async create(createEventDto: CreateEventDto, actor: AuthenticatedUser): Promise<Event> {
    try {
      this.logger.log(`Creating new event: ${createEventDto.title}`);

      const rawParticipants = (createEventDto as unknown as { participants?: unknown[] }).participants;
      const participantsTyped = this.eventParticipantsService.normalizeParticipants(rawParticipants, false);
      if (!participantsTyped) {
        throw new BadRequestException('participants must be a non-empty array');
      }

      const participantsWithActor = this.ensureActorParticipant(participantsTyped, actor);

      const event = this.eventRepository.create({
        title: createEventDto.title,
        description: createEventDto.description,
        icon: createEventDto.icon,
        participants: participantsWithActor,
      } as DeepPartial<Event>);

      const savedEvent = await this.eventRepository.save(event);
      savedEvent.lastModified = savedEvent.updatedAt;

      this.logger.log(`Event created successfully with ID: ${savedEvent.id}`);
      return savedEvent;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      const err = error as Error;
      this.logger.error(`Failed to create event: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Failed to create event');
    }
  }

  /**
   * Update an existing event.
   * When participantReplacements are provided, wraps the update and transaction
   * migration in a single DB transaction for atomicity.
   */
  async update(id: string, updateEventDto: UpdateEventDto, actor: AuthenticatedUser): Promise<Event> {
    try {
      this.logger.log(`Updating event with ID: ${id}`);

      const event = await this.eventQueryService.findEventOrThrow(id);
      this.ensureCanAccessEvent(event, actor);

      const rawParticipants = (updateEventDto as unknown as { participants?: unknown[] }).participants;
      const normalizedParticipants = this.eventParticipantsService.normalizeParticipants(rawParticipants, true);

      const rawParticipantReplacements = (updateEventDto as { participantReplacements?: ParticipantReplacementDto[] })
        .participantReplacements;
      const participantReplacements = this.eventParticipantsService.validateParticipantReplacements(
        event.participants ?? [],
        normalizedParticipants,
        rawParticipantReplacements,
      );

      const cleanUpdate = this.buildCleanEventUpdate(updateEventDto, normalizedParticipants);

      if (participantReplacements.length > 0) {
        const savedEvent = await this.eventRepository.manager.transaction(async (manager) => {
          const transactionalEventRepository = manager.getRepository(Event);
          const eventToUpdate = await transactionalEventRepository.findOne({ where: { id } });

          if (!eventToUpdate) {
            throw new NotFoundException(`Event with ID ${id} not found`);
          }

          this.ensureCanAccessEvent(eventToUpdate, actor);

          const updatedEvent = transactionalEventRepository.merge(eventToUpdate, cleanUpdate);
          const transactionSavedEvent = await transactionalEventRepository.save(updatedEvent);

          await this.eventParticipantsService.applyParticipantReplacements(manager, id, participantReplacements);

          return transactionSavedEvent;
        });

        await this.eventQueryService.calculateLastModified(savedEvent);
        this.logger.log(`Event ${id} updated successfully with ${participantReplacements.length} replacements`);
        return savedEvent;
      }

      const updatedEvent = this.eventRepository.merge(event, cleanUpdate);
      const savedEvent = await this.eventRepository.save(updatedEvent);
      await this.eventQueryService.calculateLastModified(savedEvent);

      this.logger.log(`Event ${id} updated successfully`);
      return savedEvent;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      const err = error as Error;
      this.logger.error(`Failed to update event ${id}: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Failed to update event');
    }
  }

  /**
   * Delete an event (cascade deletes transactions).
   */
  async remove(id: string, actor: AuthenticatedUser): Promise<void> {
    try {
      this.logger.log(`Deleting event with ID: ${id}`);

      const event = await this.eventQueryService.findEventOrThrow(id);
      this.ensureCanAccessEvent(event, actor);

      await this.eventRepository.delete(id);
      this.logger.log(`Event ${id} deleted successfully`);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const err = error as Error;
      this.logger.error(`Failed to delete event ${id}: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Failed to delete event');
    }
  }

  /**
   * Get KPIs for a specific event.
   */
  async getKPIs(eventId: string, actor: AuthenticatedUser): Promise<EventKPIsDto> {
    const event = await this.eventQueryService.findEventOrThrow(eventId);
    this.ensureCanAccessEvent(event, actor);
    return this.eventKPIsService.getKPIs(eventId, actor);
  }
}
