import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { Repository } from 'typeorm';
import { MealSlot } from '@friends/shared-types';
import { AppModule } from '../src/app.module';
import { Event, EventStatus } from '../src/modules/events/entities/event.entity';
import { CalendarDay } from '../src/modules/calendar/entities/calendar-day.entity';
import { CalendarMeal } from '../src/modules/calendar/entities/calendar-meal.entity';
import { CalendarAttendance } from '../src/modules/calendar/entities/calendar-attendance.entity';
import { User } from '../src/modules/users/user.entity';
import { applyAppTestConfig } from './utils/test-app-config';
import { createCalendarAttendance, createCalendarDay, createEvent, createUser, mealOf } from './utils/test-factories';
import { buildAuthHeader, getDataFromBody, getDataObjectFromBody } from './utils/test-http-helpers';

const UNKNOWN_UUID = '00000000-0000-4000-8000-000000000000';

describe('Event calendar API (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let userRepository: Repository<User>;
  let eventRepository: Repository<Event>;
  let dayRepository: Repository<CalendarDay>;
  let mealRepository: Repository<CalendarMeal>;
  let attendanceRepository: Repository<CalendarAttendance>;

  let member: User;
  let outsider: User;
  let admin: User;
  let event: Event;

  const httpServer = () => app.getHttpServer() as Parameters<typeof request>[0];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    applyAppTestConfig(app);
    await app.init();

    jwtService = app.get(JwtService);
    userRepository = app.get<Repository<User>>(getRepositoryToken(User));
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
    await userRepository.createQueryBuilder().delete().from(User).execute();

    member = await createUser(userRepository, { email: 'member@example.com', name: 'Member' });
    outsider = await createUser(userRepository, { email: 'outsider@example.com', name: 'Outsider' });
    admin = await createUser(userRepository, { email: 'admin@example.com', name: 'Admin', role: 'admin' });

    event = await createEvent(eventRepository, {
      title: 'Calendar Event',
      status: EventStatus.ACTIVE,
      participants: [
        { type: 'user', id: member.id },
        { type: 'guest', id: 'g1', name: 'Familia Gil' },
        { type: 'pot', id: '0' },
      ],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/events/:eventId/calendar', () => {
    it('returns 401 without a JWT', async () => {
      await request(httpServer()).get(`/api/events/${event.id}/calendar`).expect(401);
    });

    it('returns the days in date order, each with its sittings in Lunch/Dinner order', async () => {
      await createCalendarDay(dayRepository, { eventId: event.id, date: '2026-09-13' });
      await createCalendarDay(dayRepository, { eventId: event.id, date: '2026-09-12' });

      const response = await request(httpServer())
        .get(`/api/events/${event.id}/calendar`)
        .set('Authorization', buildAuthHeader(jwtService, member))
        .expect(200);

      const days = getDataFromBody(response.body) as Array<{ date: string; meals: Array<{ slot: string }> }>;

      expect(days.map((day) => day.date)).toEqual(['2026-09-12', '2026-09-13']);
      // Ordered by MEAL_SLOTS, which is the point: sorting the column would put dinner first.
      expect(days[0].meals.map((meal) => meal.slot)).toEqual([MealSlot.LUNCH, MealSlot.DINNER]);
    });

    it('nests the attendances under their sitting', async () => {
      const day = await createCalendarDay(dayRepository, { eventId: event.id });
      await createCalendarAttendance(attendanceRepository, {
        mealId: mealOf(day, MealSlot.LUNCH).id,
        participantId: 'g1',
        adults: 2,
        children: 3,
      });

      const response = await request(httpServer())
        .get(`/api/events/${event.id}/calendar`)
        .set('Authorization', buildAuthHeader(jwtService, member))
        .expect(200);

      const days = getDataFromBody(response.body) as Array<{
        meals: Array<{ slot: string; attendances: Array<{ participantId: string; adults: number; children: number }> }>;
      }>;

      expect(days[0].meals[0].attendances).toEqual([
        expect.objectContaining({ participantId: 'g1', adults: 2, children: 3 }),
      ]);
    });

    it('lets an admin that does not take part read it, and refuses an outsider', async () => {
      await request(httpServer())
        .get(`/api/events/${event.id}/calendar`)
        .set('Authorization', buildAuthHeader(jwtService, admin))
        .expect(200);

      await request(httpServer())
        .get(`/api/events/${event.id}/calendar`)
        .set('Authorization', buildAuthHeader(jwtService, outsider))
        .expect(403);
    });

    it('does not leak the calendar of another event', async () => {
      const otherEvent = await createEvent(eventRepository, {
        title: 'Other Event',
        participants: [{ type: 'user', id: member.id }],
      });
      await createCalendarDay(dayRepository, { eventId: otherEvent.id });

      const response = await request(httpServer())
        .get(`/api/events/${event.id}/calendar`)
        .set('Authorization', buildAuthHeader(jwtService, member))
        .expect(200);

      expect(getDataFromBody(response.body)).toEqual([]);
    });

    it('returns 404 for an unknown event and 400 for a malformed id', async () => {
      await request(httpServer())
        .get(`/api/events/${UNKNOWN_UUID}/calendar`)
        .set('Authorization', buildAuthHeader(jwtService, member))
        .expect(404);

      await request(httpServer())
        .get('/api/events/not-a-uuid/calendar')
        .set('Authorization', buildAuthHeader(jwtService, member))
        .expect(400);
    });
  });

  describe('POST /api/events/:eventId/calendar/days', () => {
    const postDays = (body: object, actor: User = member) =>
      request(httpServer())
        .post(`/api/events/${event.id}/calendar/days`)
        .set('Authorization', buildAuthHeader(jwtService, actor))
        .send(body);

    it('returns 401 without a JWT', async () => {
      await request(httpServer())
        .post(`/api/events/${event.id}/calendar/days`)
        .send({ dates: ['2026-09-12'] })
        .expect(401);
    });

    it('creates each requested day with both sittings', async () => {
      const response = await postDays({ dates: ['2026-09-12', '2026-09-13'] }).expect(201);

      const days = getDataFromBody(response.body) as Array<{ date: string; meals: Array<{ slot: string }> }>;
      expect(days.map((day) => day.date)).toEqual(['2026-09-12', '2026-09-13']);
      expect(await mealRepository.count()).toBe(4);
    });

    it('applies the optional description to every day created', async () => {
      const response = await postDays({ dates: ['2026-09-12'], description: 'BAILE DE DISFRACES' }).expect(201);

      const days = getDataFromBody(response.body) as Array<{ description: string }>;
      expect(days[0].description).toBe('BAILE DE DISFRACES');
    });

    it('ignores the dates the event already has instead of failing', async () => {
      await postDays({ dates: ['2026-09-12'] }).expect(201);

      const response = await postDays({ dates: ['2026-09-12', '2026-09-13'] }).expect(201);

      const days = getDataFromBody(response.body) as Array<{ date: string }>;
      expect(days.map((day) => day.date)).toEqual(['2026-09-13']);
      expect(await dayRepository.count()).toBe(2);
    });

    it('rejects a malformed date, a date that does not exist, and an empty list', async () => {
      await postDays({ dates: ['12-09-2026'] }).expect(400);
      await postDays({ dates: ['2026-02-31'] }).expect(400);
      await postDays({ dates: [] }).expect(400);
    });

    it('rejects an unknown property, because the validation pipe forbids them', async () => {
      await postDays({ dates: ['2026-09-12'], colour: 'red' }).expect(400);
    });

    it('refuses an outsider and accepts an admin', async () => {
      await postDays({ dates: ['2026-09-12'] }, outsider).expect(403);
      await postDays({ dates: ['2026-09-14'] }, admin).expect(201);
    });

    it('returns 404 for an unknown event', async () => {
      await request(httpServer())
        .post(`/api/events/${UNKNOWN_UUID}/calendar/days`)
        .set('Authorization', buildAuthHeader(jwtService, member))
        .send({ dates: ['2026-09-12'] })
        .expect(404);
    });
  });

  describe('PATCH /api/calendar-days/:id', () => {
    it('sets and then clears the description of the day', async () => {
      const day = await createCalendarDay(dayRepository, { eventId: event.id });

      const set = await request(httpServer())
        .patch(`/api/calendar-days/${day.id}`)
        .set('Authorization', buildAuthHeader(jwtService, member))
        .send({ description: 'BAILE DE DISFRACES' })
        .expect(200);
      expect(getDataObjectFromBody(set.body)).toMatchObject({ description: 'BAILE DE DISFRACES' });

      const cleared = await request(httpServer())
        .patch(`/api/calendar-days/${day.id}`)
        .set('Authorization', buildAuthHeader(jwtService, member))
        .send({ description: null })
        .expect(200);
      expect(getDataObjectFromBody(cleared.body)).toMatchObject({ description: null });
    });

    it('refuses an outsider and returns 404 for an unknown day', async () => {
      const day = await createCalendarDay(dayRepository, { eventId: event.id });

      await request(httpServer())
        .patch(`/api/calendar-days/${day.id}`)
        .set('Authorization', buildAuthHeader(jwtService, outsider))
        .send({ description: 'nope' })
        .expect(403);

      await request(httpServer())
        .patch(`/api/calendar-days/${UNKNOWN_UUID}`)
        .set('Authorization', buildAuthHeader(jwtService, member))
        .send({ description: 'nope' })
        .expect(404);
    });

    it('returns 401 without a JWT and 400 for a malformed id', async () => {
      const day = await createCalendarDay(dayRepository, { eventId: event.id });

      await request(httpServer()).patch(`/api/calendar-days/${day.id}`).send({ description: 'x' }).expect(401);

      await request(httpServer())
        .patch('/api/calendar-days/not-a-uuid')
        .set('Authorization', buildAuthHeader(jwtService, member))
        .send({ description: 'x' })
        .expect(400);
    });
  });

  describe('DELETE /api/calendar-days/:id', () => {
    it('removes the day along with its sittings and attendances', async () => {
      const day = await createCalendarDay(dayRepository, { eventId: event.id });
      await createCalendarAttendance(attendanceRepository, {
        mealId: mealOf(day, MealSlot.LUNCH).id,
        participantId: 'g1',
      });

      await request(httpServer())
        .delete(`/api/calendar-days/${day.id}`)
        .set('Authorization', buildAuthHeader(jwtService, member))
        .expect(204);

      expect(await dayRepository.count()).toBe(0);
      expect(await mealRepository.count()).toBe(0);
      expect(await attendanceRepository.count()).toBe(0);
    });

    it('refuses an outsider, returns 404 for an unknown day and 401 without a JWT', async () => {
      const day = await createCalendarDay(dayRepository, { eventId: event.id });

      await request(httpServer())
        .delete(`/api/calendar-days/${day.id}`)
        .set('Authorization', buildAuthHeader(jwtService, outsider))
        .expect(403);

      await request(httpServer())
        .delete(`/api/calendar-days/${UNKNOWN_UUID}`)
        .set('Authorization', buildAuthHeader(jwtService, member))
        .expect(404);

      await request(httpServer()).delete(`/api/calendar-days/${day.id}`).expect(401);
    });
  });

  describe('PATCH /api/calendar-meals/:id', () => {
    it('sets the plan of the sitting', async () => {
      const day = await createCalendarDay(dayRepository, { eventId: event.id });

      const response = await request(httpServer())
        .patch(`/api/calendar-meals/${mealOf(day, MealSlot.DINNER).id}`)
        .set('Authorization', buildAuthHeader(jwtService, member))
        .send({ description: 'Paella' })
        .expect(200);

      expect(getDataObjectFromBody(response.body)).toMatchObject({ slot: MealSlot.DINNER, description: 'Paella' });
    });

    it('refuses an outsider and returns 404 for an unknown sitting', async () => {
      const day = await createCalendarDay(dayRepository, { eventId: event.id });

      await request(httpServer())
        .patch(`/api/calendar-meals/${mealOf(day, MealSlot.LUNCH).id}`)
        .set('Authorization', buildAuthHeader(jwtService, outsider))
        .send({ description: 'nope' })
        .expect(403);

      await request(httpServer())
        .patch(`/api/calendar-meals/${UNKNOWN_UUID}`)
        .set('Authorization', buildAuthHeader(jwtService, member))
        .send({ description: 'nope' })
        .expect(404);
    });
  });

  describe('PUT /api/calendar-meals/:mealId/attendances', () => {
    const setAttendance = (mealId: string, body: object, actor: User = member) =>
      request(httpServer())
        .put(`/api/calendar-meals/${mealId}/attendances`)
        .set('Authorization', buildAuthHeader(jwtService, actor))
        .send(body);

    it('creates, then updates, then removes the cell', async () => {
      const day = await createCalendarDay(dayRepository, { eventId: event.id });
      const mealId = mealOf(day, MealSlot.LUNCH).id;

      const created = await setAttendance(mealId, { participantId: 'g1', adults: 2, children: 3 }).expect(200);
      expect(getDataObjectFromBody(created.body)).toEqual({ participantId: 'g1', adults: 2, children: 3 });
      expect(await attendanceRepository.count()).toBe(1);

      await setAttendance(mealId, { participantId: 'g1', adults: 4, children: 1 }).expect(200);
      expect(await attendanceRepository.count()).toBe(1);
      const stored = await attendanceRepository.findOneOrFail({ where: { mealId, participantId: 'g1' } });
      expect(stored).toMatchObject({ adults: 4, children: 1 });

      // Back to zero deletes the row, and still answers with the state of the cell.
      const cleared = await setAttendance(mealId, { participantId: 'g1', adults: 0, children: 0 }).expect(200);
      expect(getDataObjectFromBody(cleared.body)).toEqual({ participantId: 'g1', adults: 0, children: 0 });
      expect(await attendanceRepository.count()).toBe(0);
    });

    it('signs up a user participant as well as a guest', async () => {
      const day = await createCalendarDay(dayRepository, { eventId: event.id });

      await setAttendance(mealOf(day, MealSlot.LUNCH).id, {
        participantId: member.id,
        adults: 1,
        children: 0,
      }).expect(200);

      expect(await attendanceRepository.count()).toBe(1);
    });

    it('rejects the pot and anybody outside the participants of the event', async () => {
      const day = await createCalendarDay(dayRepository, { eventId: event.id });
      const mealId = mealOf(day, MealSlot.LUNCH).id;

      await setAttendance(mealId, { participantId: '0', adults: 1, children: 0 }).expect(400);
      await setAttendance(mealId, { participantId: outsider.id, adults: 1, children: 0 }).expect(400);
    });

    it('rejects negative counts and a missing one', async () => {
      const day = await createCalendarDay(dayRepository, { eventId: event.id });
      const mealId = mealOf(day, MealSlot.LUNCH).id;

      await setAttendance(mealId, { participantId: 'g1', adults: -1, children: 0 }).expect(400);
      await setAttendance(mealId, { participantId: 'g1', adults: 1 }).expect(400);
    });

    it('refuses an outsider, accepts an admin, and returns 404 for an unknown sitting', async () => {
      const day = await createCalendarDay(dayRepository, { eventId: event.id });
      const mealId = mealOf(day, MealSlot.LUNCH).id;

      await setAttendance(mealId, { participantId: 'g1', adults: 1, children: 0 }, outsider).expect(403);
      await setAttendance(mealId, { participantId: 'g1', adults: 1, children: 0 }, admin).expect(200);

      await setAttendance(UNKNOWN_UUID, { participantId: 'g1', adults: 1, children: 0 }).expect(404);
    });

    it('returns 401 without a JWT', async () => {
      const day = await createCalendarDay(dayRepository, { eventId: event.id });

      await request(httpServer())
        .put(`/api/calendar-meals/${mealOf(day, MealSlot.LUNCH).id}/attendances`)
        .send({ participantId: 'g1', adults: 1, children: 0 })
        .expect(401);
    });
  });
});
