import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport/dist/auth.guard';
import { ApiStandardResponse } from '../../common/decorators/api-standard-response.decorator';
import { ApiErrorResponseDto } from '../../common/dto/api-error-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { RolesGuard } from '../auth/roles/roles.guard';
import { CalendarService } from './calendar.service';
import { CalendarDay } from './entities/calendar-day.entity';
import { CalendarMeal } from './entities/calendar-meal.entity';
import { CreateCalendarDaysDto } from './dto/create-calendar-days.dto';
import { UpdateCalendarDayDto } from './dto/update-calendar-day.dto';
import { UpdateCalendarMealDto } from './dto/update-calendar-meal.dto';
import { SetAttendanceDto } from './dto/set-attendance.dto';
import { AttendanceCellDto } from './dto/attendance-cell.dto';

/**
 * Controller for nested routes under events
 * Handles: /api/events/:eventId/calendar
 */
@ApiTags('Event Calendar')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Unauthorized', type: ApiErrorResponseDto })
@ApiResponse({ status: 403, description: 'Forbidden', type: ApiErrorResponseDto })
@Controller('events/:eventId/calendar')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class EventCalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  /**
   * GET /api/events/:eventId/calendar
   * Get the whole meal calendar of an event
   */
  @Get()
  @ApiOperation({ summary: 'Get the meal calendar of an event' })
  @ApiParam({ name: 'eventId', description: 'Event UUID', type: String, format: 'uuid' })
  @ApiStandardResponse(200, 'Calendar retrieved successfully', CalendarDay, true)
  @ApiResponse({ status: 404, description: 'Event not found', type: ApiErrorResponseDto })
  findByEvent(@Param('eventId', ParseUUIDPipe) eventId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.calendarService.findByEvent(eventId, user);
  }

  /**
   * POST /api/events/:eventId/calendar/days
   * Add days to the calendar of an event
   */
  @Post('days')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add days to the calendar of an event',
    description: 'Dates the event already has are ignored, so overlapping ranges can be sent safely',
  })
  @ApiParam({ name: 'eventId', description: 'Event UUID', type: String, format: 'uuid' })
  @ApiStandardResponse(201, 'Calendar days created successfully', CalendarDay, true)
  @ApiResponse({ status: 400, description: 'Invalid input', type: ApiErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Event not found', type: ApiErrorResponseDto })
  createDays(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() createCalendarDaysDto: CreateCalendarDaysDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.calendarService.createDays(eventId, createCalendarDaysDto, user);
  }
}

/**
 * Controller for individual calendar day operations
 * Handles: /api/calendar-days/:id
 */
@ApiTags('Calendar Days')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Unauthorized', type: ApiErrorResponseDto })
@ApiResponse({ status: 403, description: 'Forbidden', type: ApiErrorResponseDto })
@Controller('calendar-days')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CalendarDaysController {
  constructor(private readonly calendarService: CalendarService) {}

  /**
   * PATCH /api/calendar-days/:id
   * Set or clear what a day is about
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Set or clear the description of a calendar day' })
  @ApiParam({ name: 'id', description: 'Calendar day UUID', type: String, format: 'uuid' })
  @ApiStandardResponse(200, 'Calendar day updated successfully', CalendarDay)
  @ApiResponse({ status: 400, description: 'Invalid input', type: ApiErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Calendar day not found', type: ApiErrorResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCalendarDayDto: UpdateCalendarDayDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.calendarService.updateDay(id, updateCalendarDayDto, user);
  }

  /**
   * DELETE /api/calendar-days/:id
   * Remove a day, along with its sittings and their attendances
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a calendar day and every attendance on it' })
  @ApiParam({ name: 'id', description: 'Calendar day UUID', type: String, format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Calendar day deleted successfully' })
  @ApiResponse({ status: 404, description: 'Calendar day not found', type: ApiErrorResponseDto })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    await this.calendarService.removeDay(id, user);
  }
}

/**
 * Controller for individual sitting operations
 * Handles: /api/calendar-meals/:id
 */
@ApiTags('Calendar Meals')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Unauthorized', type: ApiErrorResponseDto })
@ApiResponse({ status: 403, description: 'Forbidden', type: ApiErrorResponseDto })
@Controller('calendar-meals')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CalendarMealsController {
  constructor(private readonly calendarService: CalendarService) {}

  /**
   * PATCH /api/calendar-meals/:id
   * Set or clear the plan of a sitting
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Set or clear the plan of a lunch or dinner' })
  @ApiParam({ name: 'id', description: 'Calendar meal UUID', type: String, format: 'uuid' })
  @ApiStandardResponse(200, 'Calendar meal updated successfully', CalendarMeal)
  @ApiResponse({ status: 400, description: 'Invalid input', type: ApiErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Calendar meal not found', type: ApiErrorResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCalendarMealDto: UpdateCalendarMealDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.calendarService.updateMeal(id, updateCalendarMealDto, user);
  }

  /**
   * PUT /api/calendar-meals/:mealId/attendances
   * Write one cell of the planning grid
   */
  @Put(':mealId/attendances')
  @ApiOperation({
    summary: 'Set how many people a participant brings to a sitting',
    description: 'Setting both counts to zero removes the entry. The resulting state of the cell is returned',
  })
  @ApiParam({ name: 'mealId', description: 'Calendar meal UUID', type: String, format: 'uuid' })
  @ApiStandardResponse(200, 'Attendance set successfully', AttendanceCellDto)
  @ApiResponse({ status: 400, description: 'Invalid input', type: ApiErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Calendar meal not found', type: ApiErrorResponseDto })
  setAttendance(
    @Param('mealId', ParseUUIDPipe) mealId: string,
    @Body() setAttendanceDto: SetAttendanceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.calendarService.setAttendance(mealId, setAttendanceDto, user);
  }
}
