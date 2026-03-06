import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ApiStandardResponse } from '../../common/decorators/api-standard-response.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Event } from './entities/event.entity';
import { EventKPIsDto } from './dto/event-kpis.dto';
import { RolesGuard } from '../auth/roles.guard';
import { AuthGuard } from '@nestjs/passport/dist/auth.guard';
import { EventStatus } from './entities/event.entity';

@ApiTags('Events')
@Controller('events')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  /**
   * GET /api/events
   * Get all events
   */
  @Get()
  @ApiOperation({ summary: 'Get all events' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: EventStatus,
    description: 'Filter events by status (active/archived). Defaults to active.',
  })
  @ApiStandardResponse(200, 'Events retrieved successfully', Event, true)
  findAll(@CurrentUser() user: AuthenticatedUser, @Query('status') status?: EventStatus) {
    return this.eventsService.findAll(user, status);
  }

  /**
   * GET /api/events/:id
   * Get a single event by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a single event by ID' })
  @ApiParam({
    name: 'id',
    description: 'Event UUID',
    type: String,
    format: 'uuid',
  })
  @ApiStandardResponse(200, 'Event retrieved successfully', Event)
  @ApiResponse({ status: 404, description: 'Event not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.eventsService.findOne(id, user);
  }

  /**
   * POST /api/events
   * Create a new event
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new event' })
  @ApiStandardResponse(201, 'Event created successfully', Event)
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(@Body() createEventDto: CreateEventDto, @CurrentUser() user: AuthenticatedUser) {
    return this.eventsService.create(createEventDto, user);
  }

  /**
   * PATCH /api/events/:id
   * Update an existing event
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing event' })
  @ApiParam({
    name: 'id',
    description: 'Event UUID',
    type: String,
    format: 'uuid',
  })
  @ApiStandardResponse(200, 'Event updated successfully', Event)
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEventDto: UpdateEventDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.eventsService.update(id, updateEventDto, user);
  }

  /**
   * DELETE /api/events/:id
   * Delete an event (cascade deletes transactions)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an event (cascade deletes transactions)' })
  @ApiParam({
    name: 'id',
    description: 'Event UUID',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: 204,
    description: 'Event deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    await this.eventsService.remove(id, user);
  }

  /**
   * GET /api/events/:id/kpis
   * Get KPIs for a specific event
   */
  @Get(':id/kpis')
  @ApiOperation({ summary: 'Get KPIs for a specific event' })
  @ApiParam({
    name: 'id',
    description: 'Event UUID',
    type: String,
    format: 'uuid',
  })
  @ApiStandardResponse(200, 'KPIs retrieved successfully', EventKPIsDto)
  @ApiResponse({ status: 404, description: 'Event not found' })
  getKPIs(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.eventsService.getKPIs(id, user);
  }
}
