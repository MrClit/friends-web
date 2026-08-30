import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MealSlot } from '@friends/shared-types';
import { AppModule } from '../src/app.module';
import { Event } from '../src/modules/events/entities/event.entity';
import { CalendarDay } from '../src/modules/calendar/entities/calendar-day.entity';
import { CalendarMeal } from '../src/modules/calendar/entities/calendar-meal.entity';
import { CalendarAttendance } from '../src/modules/calendar/entities/calendar-attendance.entity';
import { createCalendarAttendance, createCalendarDay, createEvent, mealOf } from './utils/test-factories';

/**
 * The database contract of the meal calendar, as opposed to its HTTP contract, which is covered by the
 * e2e suite. What is pinned here is what only Postgres can tell us: the cascades down the three-level
 * chain, the unique constraints that make a day and a cell unrepeatable, and how the column types come
 * back through the driver.
 */
describe('Event calendar (integration)', () => {
  let app: INestApplication;
  let eventRepository: Repository<Event>;
  let dayRepository: Repository<CalendarDay>;
  let mealRepository: Repository<CalendarMeal>;
  let attendanceRepository: Repository<CalendarAttendance>;

  let event: Event;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    eventRepository = app.get<Repository<Event>>(getRepositoryToken(Event));
    dayRepository = app.get<Repository<CalendarDay>>(getRepositoryToken(CalendarDay));
    mealRepository = app.get<Repository<CalendarMeal>>(getRepositoryToken(CalendarMeal));
    attendanceRepository = app.get<Repository<CalendarAttendance>>(getRepositoryToken(CalendarAttendance));
  });

  beforeEach(async () => {
    await attendanceRepository.createQueryBuilder().delete().from(CalendarAttendance).execute();
    await mealRepository.createQueryBuilder().delete().from(CalendarMeal).execute();
    await dayRepository.createQueryBuilder().delete().from(CalendarDay).execute();
    await eventRepository.createQueryBuilder().delete().from(Event).execute();

    event = await createEvent(eventRepository, {
      title: 'Calendar Event',
      participants: [{ type: 'guest', id: 'g1', name: 'Guest 1' }],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a day together with its sittings', async () => {
    const day = await createCalendarDay(dayRepository, { eventId: event.id, date: '2026-09-12' });

    const meals = await mealRepository.find({ where: { dayId: day.id } });

    expect(meals.map((meal) => meal.slot).sort()).toEqual([MealSlot.DINNER, MealSlot.LUNCH]);
  });

  it('deletes the whole chain when the event goes', async () => {
    const day = await createCalendarDay(dayRepository, { eventId: event.id });
    await createCalendarAttendance(attendanceRepository, {
      mealId: mealOf(day, MealSlot.LUNCH).id,
      participantId: 'g1',
    });

    await eventRepository.delete(event.id);

    expect(await dayRepository.count()).toBe(0);
    expect(await mealRepository.count()).toBe(0);
    expect(await attendanceRepository.count()).toBe(0);
  });

  it('deletes the sittings and their attendances when a single day goes', async () => {
    const removed = await createCalendarDay(dayRepository, { eventId: event.id, date: '2026-09-12' });
    const kept = await createCalendarDay(dayRepository, { eventId: event.id, date: '2026-09-13' });
    await createCalendarAttendance(attendanceRepository, {
      mealId: mealOf(removed, MealSlot.LUNCH).id,
      participantId: 'g1',
    });
    await createCalendarAttendance(attendanceRepository, {
      mealId: mealOf(kept, MealSlot.LUNCH).id,
      participantId: 'g1',
    });

    await dayRepository.delete(removed.id);

    expect(await mealRepository.count()).toBe(2);
    const remaining = await attendanceRepository.find();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].mealId).toBe(mealOf(kept, MealSlot.LUNCH).id);
  });

  it('refuses the same date twice in one event, and allows it across events', async () => {
    await createCalendarDay(dayRepository, { eventId: event.id, date: '2026-09-12' });

    await expect(createCalendarDay(dayRepository, { eventId: event.id, date: '2026-09-12' })).rejects.toThrow();

    const otherEvent = await createEvent(eventRepository, { title: 'Other Event' });
    await expect(
      createCalendarDay(dayRepository, { eventId: otherEvent.id, date: '2026-09-12' }),
    ).resolves.toBeDefined();
  });

  it('refuses the same slot twice in one day', async () => {
    const day = await createCalendarDay(dayRepository, { eventId: event.id });

    await expect(mealRepository.save({ dayId: day.id, slot: MealSlot.LUNCH, description: null })).rejects.toThrow();
  });

  it('refuses two rows for the same participant on the same sitting', async () => {
    const day = await createCalendarDay(dayRepository, { eventId: event.id });
    const mealId = mealOf(day, MealSlot.LUNCH).id;
    await createCalendarAttendance(attendanceRepository, { mealId, participantId: 'g1' });

    await expect(createCalendarAttendance(attendanceRepository, { mealId, participantId: 'g1' })).rejects.toThrow();
  });

  it('keeps the same participant on the two sittings of a day apart', async () => {
    const day = await createCalendarDay(dayRepository, { eventId: event.id });

    await createCalendarAttendance(attendanceRepository, {
      mealId: mealOf(day, MealSlot.LUNCH).id,
      participantId: 'g1',
      adults: 2,
    });
    await createCalendarAttendance(attendanceRepository, {
      mealId: mealOf(day, MealSlot.DINNER).id,
      participantId: 'g1',
      adults: 4,
    });

    expect(await attendanceRepository.count()).toBe(2);
  });

  it('returns the date as the calendar day it was stored as, with no timezone drift', async () => {
    const saved = await createCalendarDay(dayRepository, { eventId: event.id, date: '2026-09-12' });

    const reloaded = await dayRepository.findOneOrFail({ where: { id: saved.id } });

    expect(reloaded.date).toBe('2026-09-12');
  });

  it('returns the two counts as numbers, not as strings', async () => {
    const day = await createCalendarDay(dayRepository, { eventId: event.id });
    const saved = await createCalendarAttendance(attendanceRepository, {
      mealId: mealOf(day, MealSlot.LUNCH).id,
      participantId: 'g1',
      adults: 2,
      children: 3,
    });

    const reloaded = await attendanceRepository.findOneOrFail({ where: { id: saved.id } });

    expect(reloaded.adults).toBe(2);
    expect(reloaded.children).toBe(3);
  });

  it('defaults both counts to zero', async () => {
    const day = await createCalendarDay(dayRepository, { eventId: event.id });

    const saved = await attendanceRepository.save({ mealId: mealOf(day, MealSlot.LUNCH).id, participantId: 'g1' });
    const reloaded = await attendanceRepository.findOneOrFail({ where: { id: saved.id } });

    expect(reloaded.adults).toBe(0);
    expect(reloaded.children).toBe(0);
  });
});
