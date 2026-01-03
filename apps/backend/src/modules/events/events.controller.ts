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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ApiStandardResponse } from '../../common/decorators/api-standard-response.decorator';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Event } from './entities/event.entity';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  /**
   * GET /api/events
   * Get all events
   */
  @Get()
  @ApiOperation({ summary: 'Get all events' })
  @ApiStandardResponse(200, 'Events retrieved successfully', Event, true)
  findAll() {
    return this.eventsService.findAll();
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
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventsService.findOne(id);
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
  create(@Body() createEventDto: CreateEventDto) {
    return this.eventsService.create(createEventDto);
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
  ) {
    return this.eventsService.update(id, updateEventDto);
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
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.eventsService.remove(id);
  }
}
