import { Injectable, NotFoundException, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  /**
   * Get all events ordered by creation date (newest first)
   */
  async findAll(): Promise<Event[]> {
    try {
      this.logger.log('Fetching all events');
      return await this.eventRepository.find({
        order: {
          createdAt: 'DESC',
        },
      });
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to fetch events: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Failed to fetch events');
    }
  }

  /**
   * Get a single event by ID
   */
  async findOne(id: string): Promise<Event> {
    try {
      this.logger.log(`Fetching event with ID: ${id}`);
      const event = await this.eventRepository.findOne({
        where: { id },
      });

      if (!event) {
        throw new NotFoundException(`Event with ID ${id} not found`);
      }

      return event;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const err = error as Error;
      this.logger.error(`Failed to fetch event ${id}: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Failed to fetch event');
    }
  }

  /**
   * Create a new event
   */
  async create(createEventDto: CreateEventDto): Promise<Event> {
    try {
      this.logger.log(`Creating new event: ${createEventDto.title}`);
      const event = this.eventRepository.create(createEventDto);
      const savedEvent = await this.eventRepository.save(event);
      this.logger.log(`Event created successfully with ID: ${savedEvent.id}`);
      return savedEvent;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to create event: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Failed to create event');
    }
  }

  /**
   * Update an existing event
   */
  async update(id: string, updateEventDto: UpdateEventDto): Promise<Event> {
    try {
      this.logger.log(`Updating event with ID: ${id}`);

      // Verify event exists
      const event = await this.findOne(id);

      // Merge updates
      const updatedEvent = this.eventRepository.merge(event, updateEventDto);
      const savedEvent = await this.eventRepository.save(updatedEvent);

      this.logger.log(`Event ${id} updated successfully`);
      return savedEvent;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const err = error as Error;
      this.logger.error(`Failed to update event ${id}: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Failed to update event');
    }
  }

  /**
   * Delete an event (cascade deletes transactions)
   */
  async remove(id: string): Promise<void> {
    try {
      this.logger.log(`Deleting event with ID: ${id}`);

      // Verify event exists
      await this.findOne(id);

      // Delete event (cascade will delete related transactions)
      await this.eventRepository.delete(id);

      this.logger.log(`Event ${id} deleted successfully`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const err = error as Error;
      this.logger.error(`Failed to delete event ${id}: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Failed to delete event');
    }
  }
}
