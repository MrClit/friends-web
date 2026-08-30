import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { MEAL_SLOTS } from '@friends/shared-types';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { Event } from '../events/entities/event.entity';
import { EventAccessService } from '../event-access/event-access.service';
import { RequestContextService } from '../../common/request-context/request-context.service';
import { CalendarDay } from './entities/calendar-day.entity';
import { CalendarMeal } from './entities/calendar-meal.entity';
import { CalendarAttendance } from './entities/calendar-attendance.entity';
import { CreateCalendarDaysDto } from './dto/create-calendar-days.dto';
import { UpdateCalendarDayDto } from './dto/update-calendar-day.dto';
import { UpdateCalendarMealDto } from './dto/update-calendar-meal.dto';
import { SetAttendanceDto } from './dto/set-attendance.dto';
import { AttendanceCellDto } from './dto/attendance-cell.dto';

/** The pot is a spending bucket, not a person: it never attends a meal. */
const POT_PARTICIPANT_ID = '0';

/** Postgres unique_violation. */
const UNIQUE_VIOLATION = '23505';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(
    @InjectRepository(CalendarDay)
    private readonly dayRepository: Repository<CalendarDay>,
    @InjectRepository(CalendarMeal)
    private readonly mealRepository: Repository<CalendarMeal>,
    @InjectRepository(CalendarAttendance)
    private readonly attendanceRepository: Repository<CalendarAttendance>,
    private readonly eventAccessService: EventAccessService,
    private readonly requestContext: RequestContextService,
  ) {}

  /**
   * The whole calendar of an event: days, their sittings and who is signed up to each.
   *
   * Fetched in one go, nested, because the planning grid needs all of it at once — there is no paging
   * story here, an event has a handful of days.
   */
  async findByEvent(eventId: string, actor: AuthenticatedUser): Promise<CalendarDay[]> {
    try {
      this.logger.log(`Fetching calendar for event: ${eventId}`);

      await this.eventAccessService.loadAccessibleEvent(eventId, actor);

      const days = await this.dayRepository.find({
        where: { eventId },
        relations: { meals: { attendances: true } },
        order: { date: 'ASC' },
      });

      for (const day of days) {
        this.sortMeals(day);
      }

      this.logger.log(`Found ${days.length} calendar days for event ${eventId}`);
      return days;
    } catch (error) {
      throw this.rethrow(error, 'Failed to fetch the calendar of the event', 'Failed to fetch the calendar', {
        actorId: actor.id,
        eventId,
      });
    }
  }

  /**
   * Add days to the calendar of an event, each with the full set of sittings.
   *
   * Idempotent: dates the event already has are skipped instead of rejected. The client offers a date
   * range and expands it itself, so re-sending an overlapping range is ordinary use, not an error.
   */
  async createDays(
    eventId: string,
    createCalendarDaysDto: CreateCalendarDaysDto,
    actor: AuthenticatedUser,
  ): Promise<CalendarDay[]> {
    try {
      this.logger.log(`Adding ${createCalendarDaysDto.dates.length} calendar days to event ${eventId}`);

      await this.eventAccessService.loadAccessibleEvent(eventId, actor);

      const requestedDates = Array.from(new Set(createCalendarDaysDto.dates));
      for (const date of requestedDates) {
        this.assertRealDate(date);
      }

      const newDates = await this.selectMissingDates(eventId, requestedDates);
      if (newDates.length === 0) {
        this.logger.log(`Event ${eventId} already had every requested day`);
        return [];
      }

      const days = newDates.map((date) =>
        this.dayRepository.create({
          eventId,
          date,
          description: createCalendarDaysDto.description ?? null,
          // Cascaded on insert by the relation, so a day never exists without its sittings.
          meals: MEAL_SLOTS.map((slot) => this.mealRepository.create({ slot, description: null })),
        }),
      );

      const savedDays = await this.saveNewDays(eventId, days, requestedDates);
      this.logger.log(`Added ${savedDays.length} calendar days to event ${eventId}`);
      return savedDays;
    } catch (error) {
      throw this.rethrow(error, 'Failed to add calendar days', 'Failed to add calendar days', {
        actorId: actor.id,
        eventId,
        payload: createCalendarDaysDto,
      });
    }
  }

  /** Set or clear what a day is about. */
  async updateDay(
    dayId: string,
    updateCalendarDayDto: UpdateCalendarDayDto,
    actor: AuthenticatedUser,
  ): Promise<CalendarDay> {
    try {
      this.logger.log(`Updating calendar day ${dayId}`);

      const { day } = await this.loadDayWithEvent(dayId, actor);

      if (updateCalendarDayDto.description !== undefined) {
        await this.dayRepository.update(dayId, { description: updateCalendarDayDto.description });
      }

      const updatedDay = await this.findDayOrThrow(dayId);
      this.sortMeals(updatedDay);

      this.logger.log(`Calendar day ${day.id} updated successfully`);
      return updatedDay;
    } catch (error) {
      throw this.rethrow(error, 'Failed to update calendar day', 'Failed to update the calendar day', {
        actorId: actor.id,
        dayId,
        payload: updateCalendarDayDto,
      });
    }
  }

  /** Remove a day. Its sittings and every attendance on them go with it, by cascade. */
  async removeDay(dayId: string, actor: AuthenticatedUser): Promise<void> {
    try {
      this.logger.log(`Deleting calendar day ${dayId}`);

      await this.loadDayWithEvent(dayId, actor);
      await this.dayRepository.delete(dayId);

      this.logger.log(`Calendar day ${dayId} deleted successfully`);
    } catch (error) {
      throw this.rethrow(error, 'Failed to delete calendar day', 'Failed to delete the calendar day', {
        actorId: actor.id,
        dayId,
      });
    }
  }

  /** Set or clear the plan of one sitting. */
  async updateMeal(
    mealId: string,
    updateCalendarMealDto: UpdateCalendarMealDto,
    actor: AuthenticatedUser,
  ): Promise<CalendarMeal> {
    try {
      this.logger.log(`Updating calendar meal ${mealId}`);

      await this.loadMealWithEvent(mealId, actor);

      if (updateCalendarMealDto.description !== undefined) {
        await this.mealRepository.update(mealId, { description: updateCalendarMealDto.description });
      }

      const updatedMeal = await this.findMealOrThrow(mealId);
      this.logger.log(`Calendar meal ${mealId} updated successfully`);
      return updatedMeal;
    } catch (error) {
      throw this.rethrow(error, 'Failed to update calendar meal', 'Failed to update the meal', {
        actorId: actor.id,
        mealId,
        payload: updateCalendarMealDto,
      });
    }
  }

  /**
   * Write one cell of the planning grid.
   *
   * Rows are sparse, so setting a cell back to zero deletes it rather than storing zeros. The answer is
   * the resulting state of the cell either way, zeros included: one response shape for the client to
   * reconcile its optimistic update against.
   */
  async setAttendance(
    mealId: string,
    setAttendanceDto: SetAttendanceDto,
    actor: AuthenticatedUser,
  ): Promise<AttendanceCellDto> {
    try {
      this.logger.log(`Setting attendance of participant ${setAttendanceDto.participantId} on meal ${mealId}`);

      const { event } = await this.loadMealWithEvent(mealId, actor);
      this.assertParticipantAttends(event, setAttendanceDto.participantId);

      const { participantId, adults, children } = setAttendanceDto;
      const existing = await this.attendanceRepository.findOne({ where: { mealId, participantId } });

      if (adults === 0 && children === 0) {
        if (existing) {
          await this.attendanceRepository.delete(existing.id);
        }
      } else if (existing) {
        await this.attendanceRepository.update(existing.id, { adults, children });
      } else {
        await this.attendanceRepository.save(
          this.attendanceRepository.create({ mealId, participantId, adults, children }),
        );
      }

      this.logger.log(`Attendance of ${participantId} on meal ${mealId} set to ${adults}+${children}`);
      return { participantId, adults, children };
    } catch (error) {
      throw this.rethrow(error, 'Failed to set attendance', 'Failed to set the attendance', {
        actorId: actor.id,
        mealId,
        payload: setAttendanceDto,
      });
    }
  }

  // --- helpers ---

  /**
   * Order the sittings of a day by MEAL_SLOTS and not by the database.
   *
   * Sorting by the column would put dinner before lunch, which is alphabetical and wrong. A slot the
   * list no longer knows about sorts last instead of disappearing.
   */
  private sortMeals(day: CalendarDay): void {
    if (!day.meals) return;

    const rank = (slot: string): number => {
      const index = MEAL_SLOTS.indexOf(slot as (typeof MEAL_SLOTS)[number]);
      return index === -1 ? MEAL_SLOTS.length : index;
    };

    day.meals.sort((a, b) => rank(a.slot) - rank(b.slot));
  }

  /** Which of the requested dates the event does not have yet. */
  private async selectMissingDates(eventId: string, requestedDates: string[]): Promise<string[]> {
    const existingDays = await this.dayRepository.find({
      where: { eventId, date: In(requestedDates) },
      select: { date: true },
    });
    const existingDates = new Set(existingDays.map((day) => day.date));

    return requestedDates.filter((date) => !existingDates.has(date));
  }

  /**
   * Insert the new days, treating a lost race as success.
   *
   * Two requests adding the same date at the same time both pass the filter above and the second one
   * trips the unique constraint. That is the constraint doing its job, not a failure the caller can act
   * on, so it answers with the days that ended up existing instead of a 500.
   */
  private async saveNewDays(eventId: string, days: CalendarDay[], requestedDates: string[]): Promise<CalendarDay[]> {
    try {
      return await this.dayRepository.save(days);
    } catch (error) {
      if (!this.isUniqueViolation(error)) throw error;

      this.logger.warn(`Concurrent day creation on event ${eventId}; returning the days already present`);
      return this.dayRepository.find({
        where: { eventId, date: In(requestedDates) },
        relations: { meals: true },
        order: { date: 'ASC' },
      });
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    return typeof error === 'object' && error !== null && (error as { code?: string }).code === UNIQUE_VIOLATION;
  }

  /**
   * Reject a date the regex let through but the calendar does not have, such as 2026-02-31. Left to
   * Postgres it would surface as a 500 rather than the bad request it is.
   */
  private assertRealDate(date: string): void {
    const parsed = new Date(`${date}T00:00:00.000Z`);

    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
      throw new BadRequestException(`${date} is not a real calendar date`);
    }
  }

  /** The pot never attends, and nobody outside the event's participants can be signed up. */
  private assertParticipantAttends(event: Event, participantId: string): void {
    if (participantId === POT_PARTICIPANT_ID) {
      throw new BadRequestException('The pot does not take part in the calendar');
    }

    const attends = (event.participants ?? []).some((p) => p.type !== 'pot' && p.id === participantId);

    if (!attends) {
      throw new BadRequestException(`Participant with ID ${participantId} does not exist in this event`);
    }
  }

  private async findDayOrThrow(dayId: string): Promise<CalendarDay> {
    const day = await this.dayRepository.findOne({ where: { id: dayId }, relations: { meals: true } });

    if (!day) {
      throw new NotFoundException(`Calendar day with ID ${dayId} not found`);
    }

    return day;
  }

  private async findMealOrThrow(mealId: string): Promise<CalendarMeal> {
    const meal = await this.mealRepository.findOne({ where: { id: mealId }, relations: { day: true } });

    if (!meal) {
      throw new NotFoundException(`Calendar meal with ID ${mealId} not found`);
    }

    return meal;
  }

  /**
   * Authorize a day through its event, and hand back both.
   *
   * A missing parent event is reported as a missing day on purpose, so the response never reveals
   * whether the event exists. Unlike the shopping list this fetches the event even for an admin: the
   * caller needs its participants to validate against.
   */
  private async loadDayWithEvent(dayId: string, actor: AuthenticatedUser): Promise<{ day: CalendarDay; event: Event }> {
    const day = await this.findDayOrThrow(dayId);
    const event = await this.loadParentEvent(day.eventId, actor, `Calendar day with ID ${dayId} not found`);

    return { day, event };
  }

  /** Same as loadDayWithEvent, one level down: a meal reaches its event through its day. */
  private async loadMealWithEvent(
    mealId: string,
    actor: AuthenticatedUser,
  ): Promise<{ meal: CalendarMeal; event: Event }> {
    const meal = await this.findMealOrThrow(mealId);
    const event = await this.loadParentEvent(meal.day.eventId, actor, `Calendar meal with ID ${mealId} not found`);

    return { meal, event };
  }

  private async loadParentEvent(eventId: string, actor: AuthenticatedUser, notFoundMessage: string): Promise<Event> {
    const event = await this.eventAccessService.findEvent(eventId);

    if (!event) {
      throw new NotFoundException(notFoundMessage);
    }

    if (!this.eventAccessService.isAdmin(actor) && !this.eventAccessService.canAccessEvent(event, actor)) {
      throw new ForbiddenException(`Access to event ${eventId} is not allowed`);
    }

    return event;
  }

  /**
   * The error contract every method shares: the exceptions the caller is meant to see pass through, and
   * anything else becomes a 500 after being logged with enough context to find it.
   */
  private rethrow(error: unknown, logMessage: string, publicMessage: string, context: Record<string, unknown>): Error {
    if (
      error instanceof NotFoundException ||
      error instanceof ForbiddenException ||
      error instanceof BadRequestException
    ) {
      return error;
    }

    const err = error as Error;
    this.logger.error(
      {
        msg: logMessage,
        error: err.message,
        correlationId: this.requestContext.correlationId,
        ...context,
      },
      err.stack,
    );

    return new InternalServerErrorException(publicMessage);
  }
}
