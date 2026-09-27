import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial, In } from 'typeorm';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { Event, EventParticipant, EventStatus } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { ParticipantReplacementDto } from './dto/participant-replacement.dto';
import { EventKPIsService } from './services/event-kpis.service';
import { EventQueryService } from './services/event-query.service';
import { EventParticipantsService } from './services/event-participants.service';
import { EventKPIsDto } from './dto/event-kpis.dto';
import { EventAccessService } from '../event-access/event-access.service';
import { GroupsService } from '../groups/groups.service';
import { Group } from '../groups/entities/group.entity';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    private readonly eventAccessService: EventAccessService,
    private readonly eventQueryService: EventQueryService,
    private readonly eventParticipantsService: EventParticipantsService,
    private readonly eventKPIsService: EventKPIsService,
    private readonly groupsService: GroupsService,
  ) {}

  private buildCleanEventUpdate(
    updateEventDto: UpdateEventDto,
    normalizedParticipants: EventParticipant[] | undefined,
    nextGroupId: string | undefined,
  ): DeepPartial<Event> {
    const cleanUpdate: DeepPartial<Event> = {};

    if (updateEventDto.title !== undefined) cleanUpdate.title = updateEventDto.title;
    if (updateEventDto.description !== undefined) cleanUpdate.description = updateEventDto.description;
    if (updateEventDto.icon !== undefined) cleanUpdate.icon = updateEventDto.icon;
    if (updateEventDto.status !== undefined) cleanUpdate.status = updateEventDto.status;
    if (normalizedParticipants !== undefined) cleanUpdate.participants = normalizedParticipants;
    if (nextGroupId !== undefined) cleanUpdate.groupId = nextGroupId;

    return cleanUpdate;
  }

  private userIdsOf(participants: EventParticipant[]): string[] {
    return participants.filter((p) => p.type === 'user').map((p) => p.id);
  }

  /**
   * Checks the group side of an update before anything is written, and returns the group the event moves
   * to, or undefined when it stays where it is.
   *
   * A groupId equal to the current one is not a change: the event form always sends it. Staying in the
   * same group, only the users the update adds are checked, so people who have since left the group can
   * be kept. Moving to another group is for the admin only, and then every user in the resulting list
   * has to belong to the destination.
   */
  private async resolveGroupChange(
    event: Event,
    requestedGroupId: string | undefined,
    normalizedParticipants: EventParticipant[] | undefined,
    actor: AuthenticatedUser,
  ): Promise<string | undefined> {
    if (requestedGroupId === undefined || requestedGroupId === event.groupId) {
      const addedUserIds = this.eventParticipantsService.collectAddedUserIds(
        event.participants ?? [],
        normalizedParticipants,
      );
      await this.groupsService.assertAreMembers(event.groupId, addedUserIds);
      return undefined;
    }

    if (!this.eventAccessService.isAdmin(actor)) {
      throw new ForbiddenException('Only the admin can move an event to another group');
    }

    await this.groupsService.assertCanUse(requestedGroupId, actor);
    await this.groupsService.assertAreMembers(
      requestedGroupId,
      this.userIdsOf(normalizedParticipants ?? event.participants ?? []),
    );
    return requestedGroupId;
  }

  /**
   * Attaches the group to each event, so a participant who has left the group can still see its name.
   */
  private async attachGroups(events: Event[]): Promise<void> {
    const groupIds = [...new Set(events.map((event) => event.groupId))];
    if (groupIds.length === 0) return;

    const groups = await this.eventRepository.manager.getRepository(Group).find({ where: { id: In(groupIds) } });
    const groupsById = new Map(groups.map((group) => [group.id, group]));

    for (const event of events) {
      event.group = groupsById.get(event.groupId);
    }
  }

  private ensureActorParticipant(participants: EventParticipant[], actor: AuthenticatedUser): EventParticipant[] {
    if (this.eventAccessService.isAdmin(actor)) return participants;
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

      events = events.filter((event) => this.eventAccessService.canAccessEvent(event, actor));

      await this.eventParticipantsService.enrichParticipants(events);
      await this.eventQueryService.calculateLastModified(events);
      await this.attachGroups(events);

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
      const event = await this.eventAccessService.loadAccessibleEvent(id, actor);

      await this.eventParticipantsService.enrichParticipants(event);
      await this.eventQueryService.calculateLastModified(event);
      await this.attachGroups([event]);

      return event;
    } catch (error) {
      if (error instanceof HttpException) throw error;
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

      await this.groupsService.assertCanUse(createEventDto.groupId, actor);

      const participantsTyped = this.eventParticipantsService.normalizeParticipants(createEventDto.participants, false);
      const participantsWithActor = this.ensureActorParticipant(participantsTyped!, actor);
      await this.groupsService.assertAreMembers(createEventDto.groupId, this.userIdsOf(participantsWithActor));

      const event = this.eventRepository.create({
        groupId: createEventDto.groupId,
        title: createEventDto.title,
        description: createEventDto.description,
        icon: createEventDto.icon,
        participants: participantsWithActor,
      } as DeepPartial<Event>);

      const savedEvent = await this.eventRepository.save(event);
      savedEvent.lastModified = savedEvent.updatedAt;
      await this.attachGroups([savedEvent]);

      this.logger.log(`Event created successfully with ID: ${savedEvent.id}`);
      return savedEvent;
    } catch (error) {
      if (error instanceof HttpException) throw error;
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

      const event = await this.eventAccessService.loadAccessibleEvent(id, actor);

      const normalizedParticipants = this.eventParticipantsService.normalizeParticipants(
        updateEventDto.participants,
        true,
      );

      const rawParticipantReplacements = (updateEventDto as { participantReplacements?: ParticipantReplacementDto[] })
        .participantReplacements;
      const participantReplacements = this.eventParticipantsService.validateParticipantReplacements(
        event.participants ?? [],
        normalizedParticipants,
        rawParticipantReplacements,
      );

      const nextGroupId = await this.resolveGroupChange(event, updateEventDto.groupId, normalizedParticipants, actor);

      const cleanUpdate = this.buildCleanEventUpdate(updateEventDto, normalizedParticipants, nextGroupId);

      // A replaced guest also disappears from the participants list, but its seats are migrated rather
      // than dropped, so it must not be treated as a removal too. Excluded here instead of relying on
      // the two operations running in the right order.
      const replacedGuestIds = new Set(participantReplacements.map((replacement) => replacement.fromGuestId));
      const removedParticipantIds = this.eventParticipantsService
        .collectRemovedParticipantIds(event.participants ?? [], normalizedParticipants)
        .filter((participantId) => !replacedGuestIds.has(participantId));

      if (participantReplacements.length > 0 || removedParticipantIds.length > 0) {
        const savedEvent = await this.eventRepository.manager.transaction(async (manager) => {
          const transactionalEventRepository = manager.getRepository(Event);
          const eventToUpdate = await transactionalEventRepository.findOne({ where: { id } });

          if (!eventToUpdate) {
            throw new NotFoundException(`Event with ID ${id} not found`);
          }

          this.eventAccessService.ensureCanAccessEvent(eventToUpdate, actor);

          const updatedEvent = transactionalEventRepository.merge(eventToUpdate, cleanUpdate);
          const transactionSavedEvent = await transactionalEventRepository.save(updatedEvent);

          await this.eventParticipantsService.applyParticipantReplacements(manager, id, participantReplacements);
          await this.eventParticipantsService.applyParticipantRemovals(manager, id, removedParticipantIds);

          return transactionSavedEvent;
        });

        await this.eventQueryService.calculateLastModified(savedEvent);
        await this.attachGroups([savedEvent]);
        this.logger.log(
          `Event ${id} updated successfully with ${participantReplacements.length} replacements and ${removedParticipantIds.length} removals`,
        );
        return savedEvent;
      }

      const updatedEvent = this.eventRepository.merge(event, cleanUpdate);
      const savedEvent = await this.eventRepository.save(updatedEvent);
      await this.eventQueryService.calculateLastModified(savedEvent);
      await this.attachGroups([savedEvent]);

      this.logger.log(`Event ${id} updated successfully`);
      return savedEvent;
    } catch (error) {
      if (error instanceof HttpException) throw error;
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

      await this.eventAccessService.loadAccessibleEvent(id, actor);

      await this.eventRepository.delete(id);
      this.logger.log(`Event ${id} deleted successfully`);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const err = error as Error;
      this.logger.error(`Failed to delete event ${id}: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Failed to delete event');
    }
  }

  /**
   * Get KPIs for a specific event.
   */
  async getKPIs(eventId: string, actor: AuthenticatedUser): Promise<EventKPIsDto> {
    await this.eventAccessService.loadAccessibleEvent(eventId, actor);
    return this.eventKPIsService.getKPIs(eventId, actor);
  }
}
