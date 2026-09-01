import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalendarService } from './calendar.service';
import { EventCalendarController, CalendarDaysController, CalendarMealsController } from './calendar.controller';
import { CalendarDay } from './entities/calendar-day.entity';
import { CalendarMeal } from './entities/calendar-meal.entity';
import { CalendarAttendance } from './entities/calendar-attendance.entity';
import { EventAccessModule } from '../event-access/event-access.module';

@Module({
  // The Event entity is deliberately absent: event access goes through EventAccessModule instead of a
  // second repository over the events table.
  imports: [TypeOrmModule.forFeature([CalendarDay, CalendarMeal, CalendarAttendance]), EventAccessModule],
  controllers: [EventCalendarController, CalendarDaysController, CalendarMealsController],
  // RequestContextService is not declared here on purpose: it lives in the global RequestContextModule
  // so the middleware and this module's services share the same AsyncLocalStorage instance.
  providers: [CalendarService],
  exports: [CalendarService],
})
export class CalendarModule {}
