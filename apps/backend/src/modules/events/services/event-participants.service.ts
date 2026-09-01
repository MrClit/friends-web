import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, In } from 'typeorm';
import { Event, EventParticipant, UserParticipant, GuestParticipant } from '../entities/event.entity';
import { User } from '../../users/user.entity';
import { ParticipantReplacementDto } from '../dto/participant-replacement.dto';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { CalendarMeal } from '../../calendar/entities/calendar-meal.entity';
import { CalendarAttendance } from '../../calendar/entities/calendar-attendance.entity';

@Injectable()
export class EventParticipantsService {
  private readonly logger = new Logger(EventParticipantsService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Enrich user participants with name/email/avatar from the users table.
   * Preserves contributionTarget field in the enriched participant.
   * Works with one or multiple events, batching the database query.
   */
  async enrichParticipants(events: Event | Event[]): Promise<void> {
    const eventArray = Array.isArray(events) ? events : [events];
    if (eventArray.length === 0) return;

    try {
      const allUserIds = new Set<string>();
      for (const event of eventArray) {
        const participants: EventParticipant[] = event.participants ?? [];
        for (const p of participants) {
          if (p.type === 'user' && typeof p.id === 'string') {
            allUserIds.add(p.id);
          }
        }
      }

      if (allUserIds.size === 0) return;

      const users = await this.userRepository.find({ where: { id: In(Array.from(allUserIds)) } });
      const usersById = new Map(users.map((u) => [u.id, u]));

      for (const event of eventArray) {
        event.participants = (event.participants ?? []).map((p) => {
          if (p.type === 'user' && typeof p.id === 'string') {
            const u = usersById.get(p.id);
            return {
              ...p,
              name: u?.name ?? null,
              email: u?.email ?? null,
              avatar: u?.avatar ?? null,
            };
          }
          return p;
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Failed to enrich participants: ${message}`);
    }
  }

  /**
   * Normalize and validate a raw participants array from a DTO.
   * - Strips extra properties (name/email from user participants)
   * - Accepts and validates contributionTarget (number >= 0, finite)
   * - Validates required fields per type
   * @param allowEmpty - When true (update), undefined/empty input returns undefined (skip update).
   *                     When false (create), undefined/empty input throws.
   */
  normalizeParticipants(
    rawParticipants: unknown[] | undefined,
    allowEmpty: boolean = false,
  ): EventParticipant[] | undefined {
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

    const validateContributionTarget = (target: unknown, idx: number): number | undefined => {
      if (target === undefined || target === null) {
        return undefined;
      }
      if (typeof target !== 'number') {
        throw new BadRequestException(`participants[${idx}].contributionTarget must be a number or undefined`);
      }
      if (!Number.isFinite(target)) {
        throw new BadRequestException(`participants[${idx}].contributionTarget must be finite`);
      }
      if (target < 0) {
        throw new BadRequestException(`participants[${idx}].contributionTarget must be >= 0`);
      }
      return target;
    };

    return rawParticipants.map((p: unknown, idx: number): EventParticipant => {
      if (!isPlainObject(p) || typeof p['type'] !== 'string') {
        throw new BadRequestException(`participants[${idx}].type is required`);
      }

      const type = String(p['type']);
      switch (type) {
        case 'user': {
          if (typeof p['id'] !== 'string' || !p['id'].trim()) {
            throw new BadRequestException(`participants[${idx}].id is required for user participant`);
          }
          const contributionTarget = validateContributionTarget(p['contributionTarget'], idx);
          const userParticipant = {
            type: 'user',
            id: p['id'],
            ...(contributionTarget !== undefined && { contributionTarget }),
          } as UserParticipant;
          return userParticipant;
        }
        case 'guest': {
          if (typeof p['id'] !== 'string' || !p['id'].trim()) {
            throw new BadRequestException(`participants[${idx}].id is required for guest participant`);
          }
          if (typeof p['name'] !== 'string' || !p['name'].trim()) {
            throw new BadRequestException(`participants[${idx}].name is required for guest participant`);
          }
          const contributionTarget = validateContributionTarget(p['contributionTarget'], idx);
          const guestParticipant = {
            type: 'guest',
            id: p['id'],
            name: p['name'],
            ...(contributionTarget !== undefined && { contributionTarget }),
          } as GuestParticipant;
          return guestParticipant;
        }
        case 'pot': {
          return { type: 'pot', id: '0' };
        }
        default:
          throw new BadRequestException(`participants[${idx}].type must be one of 'user'|'guest'|'pot'`);
      }
    });
  }

  /**
   * Validate business rules for guest→user participant replacements.
   * Returns the normalized (trimmed) replacement list, or [] if none provided.
   */
  validateParticipantReplacements(
    originalParticipants: EventParticipant[],
    nextParticipants: EventParticipant[] | undefined,
    participantReplacements: ParticipantReplacementDto[] | undefined,
  ): ParticipantReplacementDto[] {
    if (!participantReplacements || participantReplacements.length === 0) {
      return [];
    }

    if (!nextParticipants) {
      throw new BadRequestException('participants must be provided when participantReplacements are used');
    }

    const normalizedReplacements = participantReplacements.map((replacement, idx) => {
      const fromGuestId = replacement.fromGuestId?.trim();
      const toUserId = replacement.toUserId?.trim();

      if (!fromGuestId) {
        throw new BadRequestException(`participantReplacements[${idx}].fromGuestId is required`);
      }
      if (!toUserId) {
        throw new BadRequestException(`participantReplacements[${idx}].toUserId is required`);
      }

      return { fromGuestId, toUserId };
    });

    const sourceGuestIds = new Set<string>();
    const destinationUserIds = new Set<string>();

    for (const replacement of normalizedReplacements) {
      if (sourceGuestIds.has(replacement.fromGuestId)) {
        throw new BadRequestException(`Duplicate replacement source guest id: ${replacement.fromGuestId}`);
      }
      sourceGuestIds.add(replacement.fromGuestId);

      if (destinationUserIds.has(replacement.toUserId)) {
        throw new BadRequestException(`Duplicate replacement destination user id: ${replacement.toUserId}`);
      }
      destinationUserIds.add(replacement.toUserId);

      const sourceGuestExists = originalParticipants.some(
        (p) => p.type === 'guest' && p.id === replacement.fromGuestId,
      );
      if (!sourceGuestExists) {
        throw new BadRequestException(`Guest participant ${replacement.fromGuestId} does not exist in the event`);
      }

      const destinationUserAlreadyParticipant = originalParticipants.some(
        (p) => p.type === 'user' && p.id === replacement.toUserId,
      );
      if (destinationUserAlreadyParticipant) {
        throw new BadRequestException(
          `User ${replacement.toUserId} already participates in the event and cannot be used as replacement target`,
        );
      }

      const destinationUserInNextParticipants = nextParticipants.some(
        (p) => p.type === 'user' && p.id === replacement.toUserId,
      );
      if (!destinationUserInNextParticipants) {
        throw new BadRequestException(
          `Replacement target user ${replacement.toUserId} must exist in updated participants`,
        );
      }

      const sourceGuestStillPresent = nextParticipants.some(
        (p) => p.type === 'guest' && p.id === replacement.fromGuestId,
      );
      if (sourceGuestStillPresent) {
        throw new BadRequestException(
          `Replacement source guest ${replacement.fromGuestId} must be removed from updated participants`,
        );
      }
    }

    return normalizedReplacements;
  }

  /**
   * Bulk-update transaction and calendar attendance participant_id for each guest→user replacement.
   * Must be called inside an active TypeORM EntityManager transaction.
   */
  async applyParticipantReplacements(
    manager: EntityManager,
    eventId: string,
    participantReplacements: ParticipantReplacementDto[],
  ): Promise<void> {
    if (participantReplacements.length === 0) return;

    const transactionRepository = manager.getRepository(Transaction);
    const attendanceRepository = manager.getRepository(CalendarAttendance);
    const mealIds = await this.findMealIdsOfEvent(manager, eventId);

    for (const replacement of participantReplacements) {
      const result = await transactionRepository
        .createQueryBuilder()
        .update(Transaction)
        .set({ participantId: replacement.toUserId })
        .where('event_id = :eventId', { eventId })
        .andWhere('participant_id = :fromGuestId', { fromGuestId: replacement.fromGuestId })
        .execute();

      this.logger.log(
        `Migrated ${result.affected ?? 0} transactions from guest ${replacement.fromGuestId} to user ${replacement.toUserId} in event ${eventId}`,
      );

      // The guest's seats move with them. No unique violation is possible here: the destination user is
      // rejected upfront if it already participates, so it cannot own a row on any of these meals.
      if (mealIds.length > 0) {
        const attendanceResult = await attendanceRepository.update(
          { mealId: In(mealIds), participantId: replacement.fromGuestId },
          { participantId: replacement.toUserId },
        );

        this.logger.log(
          `Migrated ${attendanceResult.affected ?? 0} calendar attendances from guest ${replacement.fromGuestId} to user ${replacement.toUserId} in event ${eventId}`,
        );
      }
    }
  }

  /**
   * Delete the calendar attendances of participants that are no longer in the event.
   * Must be called inside an active TypeORM EntityManager transaction.
   *
   * Attendances are removed while transactions are kept, and the asymmetry is deliberate: a transaction
   * records money that already moved, whereas a future seat held by someone who is no longer coming
   * records nothing at all, and would keep inflating the totals of every meal.
   */
  async applyParticipantRemovals(
    manager: EntityManager,
    eventId: string,
    removedParticipantIds: string[],
  ): Promise<void> {
    if (removedParticipantIds.length === 0) return;

    const mealIds = await this.findMealIdsOfEvent(manager, eventId);
    if (mealIds.length === 0) return;

    const result = await manager
      .getRepository(CalendarAttendance)
      .delete({ mealId: In(mealIds), participantId: In(removedParticipantIds) });

    this.logger.log(
      `Deleted ${result.affected ?? 0} calendar attendances of ${removedParticipantIds.length} removed participants in event ${eventId}`,
    );
  }

  /**
   * Which participant ids the update drops. Comparing the two arrays is the only way to know: the
   * participants column is replaced wholesale on every update, there is no per-participant endpoint.
   */
  collectRemovedParticipantIds(
    originalParticipants: EventParticipant[],
    nextParticipants: EventParticipant[] | undefined,
  ): string[] {
    if (!nextParticipants) return [];

    const remainingIds = new Set(nextParticipants.map((p) => p.id));

    return originalParticipants.filter((p) => p.type !== 'pot' && !remainingIds.has(p.id)).map((p) => p.id);
  }

  /**
   * The meals of an event, reached through its days. Attendances hang off meals, so scoping any of the
   * bulk operations above to one event has to go through this list.
   */
  private async findMealIdsOfEvent(manager: EntityManager, eventId: string): Promise<string[]> {
    const rows = await manager
      .getRepository(CalendarMeal)
      .createQueryBuilder('meal')
      .innerJoin('meal.day', 'day')
      .select('meal.id', 'id')
      .where('day.event_id = :eventId', { eventId })
      .getRawMany<{ id: string }>();

    return rows.map((row) => row.id);
  }
}
