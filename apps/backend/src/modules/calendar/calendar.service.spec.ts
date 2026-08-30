import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { In } from 'typeorm';
import { MealSlot } from '@friends/shared-types';
import { CalendarService } from './calendar.service';
import { CalendarDay } from './entities/calendar-day.entity';
import { CalendarMeal } from './entities/calendar-meal.entity';
import { CalendarAttendance } from './entities/calendar-attendance.entity';
import { Event } from '../events/entities/event.entity';
import { EventAccessService } from '../event-access/event-access.service';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { RequestContextService } from '../../common/request-context/request-context.service';

describe('CalendarService', () => {
  let service: CalendarService;

  const adminActor: AuthenticatedUser = { id: 'admin-1', email: 'admin@example.com', role: 'admin' };
  const memberActor: AuthenticatedUser = { id: 'user-1', email: 'user-1@example.com', role: 'user' };
  const outsiderActor: AuthenticatedUser = { id: 'user-2', email: 'user-2@example.com', role: 'user' };

  const mockEvent = {
    id: 'event-uuid-1',
    title: 'Test Event',
    participants: [
      { type: 'user', id: memberActor.id },
      { type: 'guest', id: 'g1', name: 'Guest 1' },
      { type: 'pot', id: '0' },
    ],
  } as unknown as Event;

  const buildMeal = (overrides: Partial<CalendarMeal> = {}): CalendarMeal =>
    ({
      id: 'meal-uuid-1',
      dayId: 'day-uuid-1',
      slot: MealSlot.LUNCH,
      description: null,
      attendances: [],
      ...overrides,
    }) as unknown as CalendarMeal;

  const buildDay = (overrides: Partial<CalendarDay> = {}): CalendarDay =>
    ({
      id: 'day-uuid-1',
      eventId: mockEvent.id,
      date: '2026-09-12',
      description: null,
      meals: [buildMeal()],
      ...overrides,
    }) as unknown as CalendarDay;

  const mockDayRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockMealRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  const mockAttendanceRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockEventRepository = {
    findOne: jest.fn(),
  };

  const loggerErrorSpy = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalendarService,
        { provide: getRepositoryToken(CalendarDay), useValue: mockDayRepository },
        { provide: getRepositoryToken(CalendarMeal), useValue: mockMealRepository },
        { provide: getRepositoryToken(CalendarAttendance), useValue: mockAttendanceRepository },
        // The real EventAccessService is wired over a mocked event repository so these tests keep
        // exercising the access rule itself, not just the delegation to it.
        EventAccessService,
        { provide: getRepositoryToken(Event), useValue: mockEventRepository },
        { provide: RequestContextService, useValue: { correlationId: 'test-correlation-id' } },
      ],
    }).compile();

    service = module.get<CalendarService>(CalendarService);
    jest.spyOn(service['logger'], 'error').mockImplementation(loggerErrorSpy);
    jest.spyOn(service['logger'], 'log').mockImplementation(jest.fn());
    jest.spyOn(service['logger'], 'warn').mockImplementation(jest.fn());

    mockDayRepository.create.mockImplementation((input: unknown) => input);
    mockMealRepository.create.mockImplementation((input: unknown) => input);
    mockAttendanceRepository.create.mockImplementation((input: unknown) => input);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByEvent', () => {
    it('returns the days of the event with their meals and attendances', async () => {
      const days = [buildDay()];
      mockEventRepository.findOne.mockResolvedValue(mockEvent);
      mockDayRepository.find.mockResolvedValue(days);

      const result = await service.findByEvent(mockEvent.id, memberActor);

      expect(result).toEqual(days);
      expect(mockDayRepository.find).toHaveBeenCalledWith({
        where: { eventId: mockEvent.id },
        relations: { meals: { attendances: true } },
        order: { date: 'ASC' },
      });
    });

    it('orders the sittings of a day by MEAL_SLOTS and not alphabetically', async () => {
      const day = buildDay({
        meals: [
          buildMeal({ id: 'meal-dinner', slot: MealSlot.DINNER }),
          buildMeal({ id: 'meal-lunch', slot: MealSlot.LUNCH }),
        ],
      });
      mockEventRepository.findOne.mockResolvedValue(mockEvent);
      mockDayRepository.find.mockResolvedValue([day]);

      const [result] = await service.findByEvent(mockEvent.id, memberActor);

      expect(result.meals.map((meal) => meal.slot)).toEqual([MealSlot.LUNCH, MealSlot.DINNER]);
    });

    it('sorts an unknown slot last instead of dropping it', async () => {
      const day = buildDay({
        meals: [
          buildMeal({ id: 'meal-brunch', slot: 'brunch' as MealSlot }),
          buildMeal({ id: 'meal-lunch', slot: MealSlot.LUNCH }),
        ],
      });
      mockEventRepository.findOne.mockResolvedValue(mockEvent);
      mockDayRepository.find.mockResolvedValue([day]);

      const [result] = await service.findByEvent(mockEvent.id, memberActor);

      expect(result.meals.map((meal) => meal.slot)).toEqual([MealSlot.LUNCH, 'brunch']);
    });

    it('lets an admin read a calendar of an event it does not take part in', async () => {
      mockEventRepository.findOne.mockResolvedValue(mockEvent);
      mockDayRepository.find.mockResolvedValue([]);

      await expect(service.findByEvent(mockEvent.id, adminActor)).resolves.toEqual([]);
    });

    it('rejects an actor that does not take part in the event', async () => {
      mockEventRepository.findOne.mockResolvedValue(mockEvent);

      await expect(service.findByEvent(mockEvent.id, outsiderActor)).rejects.toThrow(ForbiddenException);
    });

    it('reports an unknown event as not found', async () => {
      mockEventRepository.findOne.mockResolvedValue(null);

      await expect(service.findByEvent('missing-event', memberActor)).rejects.toThrow(NotFoundException);
    });

    it('turns an unexpected failure into a 500', async () => {
      mockEventRepository.findOne.mockResolvedValue(mockEvent);
      mockDayRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(service.findByEvent(mockEvent.id, memberActor)).rejects.toThrow(InternalServerErrorException);
      expect(loggerErrorSpy).toHaveBeenCalled();
    });
  });

  describe('createDays', () => {
    beforeEach(() => {
      mockEventRepository.findOne.mockResolvedValue(mockEvent);
    });

    it('creates every requested day with the full set of sittings', async () => {
      mockDayRepository.find.mockResolvedValue([]);
      mockDayRepository.save.mockImplementation((days: CalendarDay[]) => days);

      const result = await service.createDays(mockEvent.id, { dates: ['2026-09-12'] }, memberActor);

      expect(result).toHaveLength(1);
      expect(result[0].meals.map((meal) => meal.slot)).toEqual([MealSlot.LUNCH, MealSlot.DINNER]);
      expect(result[0]).toMatchObject({ eventId: mockEvent.id, date: '2026-09-12', description: null });
    });

    it('applies the optional description to every day it creates', async () => {
      mockDayRepository.find.mockResolvedValue([]);
      mockDayRepository.save.mockImplementation((days: CalendarDay[]) => days);

      const result = await service.createDays(
        mockEvent.id,
        { dates: ['2026-09-12', '2026-09-13'], description: 'BAILE DE DISFRACES' },
        memberActor,
      );

      expect(result.map((day) => day.description)).toEqual(['BAILE DE DISFRACES', 'BAILE DE DISFRACES']);
    });

    it('deduplicates the requested dates', async () => {
      mockDayRepository.find.mockResolvedValue([]);
      mockDayRepository.save.mockImplementation((days: CalendarDay[]) => days);

      const result = await service.createDays(
        mockEvent.id,
        { dates: ['2026-09-12', '2026-09-12', '2026-09-13'] },
        memberActor,
      );

      expect(result.map((day) => day.date)).toEqual(['2026-09-12', '2026-09-13']);
    });

    it('ignores the dates the event already has instead of failing', async () => {
      mockDayRepository.find.mockResolvedValue([{ date: '2026-09-12' }]);
      mockDayRepository.save.mockImplementation((days: CalendarDay[]) => days);

      const result = await service.createDays(mockEvent.id, { dates: ['2026-09-12', '2026-09-13'] }, memberActor);

      expect(result.map((day) => day.date)).toEqual(['2026-09-13']);
    });

    it('writes nothing when every requested date is already there', async () => {
      mockDayRepository.find.mockResolvedValue([{ date: '2026-09-12' }]);

      const result = await service.createDays(mockEvent.id, { dates: ['2026-09-12'] }, memberActor);

      expect(result).toEqual([]);
      expect(mockDayRepository.save).not.toHaveBeenCalled();
    });

    it('rejects a date that the regex allows but the calendar does not have', async () => {
      mockDayRepository.find.mockResolvedValue([]);

      await expect(service.createDays(mockEvent.id, { dates: ['2026-02-31'] }, memberActor)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockDayRepository.save).not.toHaveBeenCalled();
    });

    it('answers with the days that exist when a concurrent request won the race', async () => {
      const existingDays = [buildDay()];
      mockDayRepository.find.mockResolvedValueOnce([]).mockResolvedValueOnce(existingDays);
      mockDayRepository.save.mockRejectedValue(Object.assign(new Error('duplicate key'), { code: '23505' }));

      const result = await service.createDays(mockEvent.id, { dates: ['2026-09-12'] }, memberActor);

      expect(result).toEqual(existingDays);
    });

    it('rejects an actor that does not take part in the event', async () => {
      await expect(service.createDays(mockEvent.id, { dates: ['2026-09-12'] }, outsiderActor)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('turns an unexpected failure into a 500', async () => {
      mockDayRepository.find.mockResolvedValue([]);
      mockDayRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.createDays(mockEvent.id, { dates: ['2026-09-12'] }, memberActor)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('updateDay', () => {
    beforeEach(() => {
      mockEventRepository.findOne.mockResolvedValue(mockEvent);
      mockDayRepository.findOne.mockResolvedValue(buildDay());
    });

    it('sets the description of the day', async () => {
      await service.updateDay('day-uuid-1', { description: 'BAILE DE DISFRACES' }, memberActor);

      expect(mockDayRepository.update).toHaveBeenCalledWith('day-uuid-1', { description: 'BAILE DE DISFRACES' });
    });

    it('clears the description when it is sent as null', async () => {
      await service.updateDay('day-uuid-1', { description: null }, memberActor);

      expect(mockDayRepository.update).toHaveBeenCalledWith('day-uuid-1', { description: null });
    });

    it('writes nothing when the description is absent', async () => {
      await service.updateDay('day-uuid-1', {}, memberActor);

      expect(mockDayRepository.update).not.toHaveBeenCalled();
    });

    it('reports an unknown day as not found', async () => {
      mockDayRepository.findOne.mockResolvedValue(null);

      await expect(service.updateDay('missing-day', {}, memberActor)).rejects.toThrow(NotFoundException);
    });

    it('reports a day whose event is gone as a missing day, never as forbidden', async () => {
      mockEventRepository.findOne.mockResolvedValue(null);

      await expect(service.updateDay('day-uuid-1', {}, memberActor)).rejects.toThrow(
        new NotFoundException('Calendar day with ID day-uuid-1 not found'),
      );
    });

    it('rejects an actor that does not take part in the event', async () => {
      await expect(service.updateDay('day-uuid-1', {}, outsiderActor)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeDay', () => {
    it('deletes the day, taking its sittings and attendances with it', async () => {
      mockEventRepository.findOne.mockResolvedValue(mockEvent);
      mockDayRepository.findOne.mockResolvedValue(buildDay());

      await service.removeDay('day-uuid-1', memberActor);

      expect(mockDayRepository.delete).toHaveBeenCalledWith('day-uuid-1');
    });

    it('reports an unknown day as not found', async () => {
      mockDayRepository.findOne.mockResolvedValue(null);

      await expect(service.removeDay('missing-day', memberActor)).rejects.toThrow(NotFoundException);
      expect(mockDayRepository.delete).not.toHaveBeenCalled();
    });

    it('turns an unexpected failure into a 500', async () => {
      mockEventRepository.findOne.mockResolvedValue(mockEvent);
      mockDayRepository.findOne.mockResolvedValue(buildDay());
      mockDayRepository.delete.mockRejectedValue(new Error('Database error'));

      await expect(service.removeDay('day-uuid-1', memberActor)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('updateMeal', () => {
    beforeEach(() => {
      mockEventRepository.findOne.mockResolvedValue(mockEvent);
      mockMealRepository.findOne.mockResolvedValue(buildMeal({ day: buildDay() }));
    });

    it('sets the plan of the sitting', async () => {
      await service.updateMeal('meal-uuid-1', { description: 'Paella' }, memberActor);

      expect(mockMealRepository.update).toHaveBeenCalledWith('meal-uuid-1', { description: 'Paella' });
    });

    it('writes nothing when the description is absent', async () => {
      await service.updateMeal('meal-uuid-1', {}, memberActor);

      expect(mockMealRepository.update).not.toHaveBeenCalled();
    });

    it('reports an unknown meal as not found', async () => {
      mockMealRepository.findOne.mockResolvedValue(null);

      await expect(service.updateMeal('missing-meal', {}, memberActor)).rejects.toThrow(NotFoundException);
    });

    it('rejects an actor that does not take part in the event', async () => {
      await expect(service.updateMeal('meal-uuid-1', {}, outsiderActor)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('setAttendance', () => {
    beforeEach(() => {
      mockEventRepository.findOne.mockResolvedValue(mockEvent);
      mockMealRepository.findOne.mockResolvedValue(buildMeal({ day: buildDay() }));
    });

    it('creates the row the first time a cell is filled in', async () => {
      mockAttendanceRepository.findOne.mockResolvedValue(null);
      mockAttendanceRepository.save.mockImplementation((attendance: unknown) => attendance);

      const result = await service.setAttendance(
        'meal-uuid-1',
        { participantId: 'g1', adults: 2, children: 3 },
        memberActor,
      );

      expect(mockAttendanceRepository.save).toHaveBeenCalledWith({
        mealId: 'meal-uuid-1',
        participantId: 'g1',
        adults: 2,
        children: 3,
      });
      expect(result).toEqual({ participantId: 'g1', adults: 2, children: 3 });
    });

    it('updates the row when the cell already had a value', async () => {
      mockAttendanceRepository.findOne.mockResolvedValue({ id: 'attendance-1' });

      const result = await service.setAttendance(
        'meal-uuid-1',
        { participantId: 'g1', adults: 1, children: 0 },
        memberActor,
      );

      expect(mockAttendanceRepository.update).toHaveBeenCalledWith('attendance-1', { adults: 1, children: 0 });
      expect(mockAttendanceRepository.save).not.toHaveBeenCalled();
      expect(result).toEqual({ participantId: 'g1', adults: 1, children: 0 });
    });

    it('deletes the row when the cell is set back to zero, and still answers with the cell', async () => {
      mockAttendanceRepository.findOne.mockResolvedValue({ id: 'attendance-1' });

      const result = await service.setAttendance(
        'meal-uuid-1',
        { participantId: 'g1', adults: 0, children: 0 },
        memberActor,
      );

      expect(mockAttendanceRepository.delete).toHaveBeenCalledWith('attendance-1');
      expect(result).toEqual({ participantId: 'g1', adults: 0, children: 0 });
    });

    it('writes nothing when an empty cell is set to zero', async () => {
      mockAttendanceRepository.findOne.mockResolvedValue(null);

      await service.setAttendance('meal-uuid-1', { participantId: 'g1', adults: 0, children: 0 }, memberActor);

      expect(mockAttendanceRepository.delete).not.toHaveBeenCalled();
      expect(mockAttendanceRepository.save).not.toHaveBeenCalled();
    });

    it('rejects the pot, which does not eat', async () => {
      await expect(
        service.setAttendance('meal-uuid-1', { participantId: '0', adults: 1, children: 0 }, memberActor),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects somebody who does not take part in the event', async () => {
      await expect(
        service.setAttendance('meal-uuid-1', { participantId: 'stranger', adults: 1, children: 0 }, memberActor),
      ).rejects.toThrow(BadRequestException);
    });

    it('reports an unknown meal as not found', async () => {
      mockMealRepository.findOne.mockResolvedValue(null);

      await expect(
        service.setAttendance('missing-meal', { participantId: 'g1', adults: 1, children: 0 }, memberActor),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects an actor that does not take part in the event', async () => {
      await expect(
        service.setAttendance('meal-uuid-1', { participantId: 'g1', adults: 1, children: 0 }, outsiderActor),
      ).rejects.toThrow(ForbiddenException);
    });

    it('lets an admin write on an event it does not take part in', async () => {
      mockAttendanceRepository.findOne.mockResolvedValue(null);
      mockAttendanceRepository.save.mockImplementation((attendance: unknown) => attendance);

      await expect(
        service.setAttendance('meal-uuid-1', { participantId: 'g1', adults: 1, children: 0 }, adminActor),
      ).resolves.toEqual({ participantId: 'g1', adults: 1, children: 0 });
    });

    it('scopes the lookup of the cell to the meal and the participant', async () => {
      mockAttendanceRepository.findOne.mockResolvedValue(null);
      mockAttendanceRepository.save.mockImplementation((attendance: unknown) => attendance);

      await service.setAttendance('meal-uuid-1', { participantId: 'g1', adults: 1, children: 0 }, memberActor);

      expect(mockAttendanceRepository.findOne).toHaveBeenCalledWith({
        where: { mealId: 'meal-uuid-1', participantId: 'g1' },
      });
    });

    it('turns an unexpected failure into a 500', async () => {
      mockAttendanceRepository.findOne.mockRejectedValue(new Error('Database error'));

      await expect(
        service.setAttendance('meal-uuid-1', { participantId: 'g1', adults: 1, children: 0 }, memberActor),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('selectMissingDates', () => {
    it('asks the database only about the dates it was given', async () => {
      mockEventRepository.findOne.mockResolvedValue(mockEvent);
      mockDayRepository.find.mockResolvedValue([]);
      mockDayRepository.save.mockImplementation((days: CalendarDay[]) => days);

      await service.createDays(mockEvent.id, { dates: ['2026-09-12', '2026-09-13'] }, memberActor);

      expect(mockDayRepository.find).toHaveBeenCalledWith({
        where: { eventId: mockEvent.id, date: In(['2026-09-12', '2026-09-13']) },
        select: { date: true },
      });
    });
  });
});
