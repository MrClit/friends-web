import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../entities/event.entity';

interface LastModifiedResult {
  lastModified: Date | string;
}

interface BatchLastModifiedResult {
  eventId: string;
  lastModified: Date | string;
}

@Injectable()
export class EventQueryService {
  private readonly logger = new Logger(EventQueryService.name);

  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  async findEventOrThrow(id: string): Promise<Event> {
    const event = await this.eventRepository.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    return event;
  }

  /**
   * Calculate lastModified for event(s) as the greatest between event.updatedAt
   * and max(transactions.updatedAt). Batches DB queries for multiple events.
   */
  async calculateLastModified(events: Event | Event[]): Promise<void> {
    const eventArray = Array.isArray(events) ? events : [events];
    if (eventArray.length === 0) return;

    try {
      if (eventArray.length === 1) {
        const event = eventArray[0];
        const result = await this.eventRepository
          .createQueryBuilder('event')
          .leftJoin('event.transactions', 'tx')
          .where('event.id = :id', { id: event.id })
          .select('GREATEST(event.updated_at, COALESCE(MAX(tx.updated_at), event.updated_at))', 'lastModified')
          .groupBy('event.id')
          .getRawOne<LastModifiedResult>();

        event.lastModified = result?.lastModified ? new Date(result.lastModified) : event.updatedAt;
        return;
      }

      const eventIds = eventArray.map((e) => e.id);
      const results = await this.eventRepository
        .createQueryBuilder('event')
        .leftJoin('event.transactions', 'tx')
        .where('event.id IN (:...ids)', { ids: eventIds })
        .select('event.id', 'eventId')
        .addSelect('GREATEST(event.updated_at, COALESCE(MAX(tx.updated_at), event.updated_at))', 'lastModified')
        .groupBy('event.id')
        .getRawMany<BatchLastModifiedResult>();

      const lastModifiedMap = new Map(
        results.map((r) => [r.eventId, r.lastModified ? new Date(r.lastModified) : null]),
      );

      for (const event of eventArray) {
        event.lastModified = lastModifiedMap.get(event.id) ?? event.updatedAt;
      }
    } catch (err) {
      this.logger.warn(`Failed to calculate lastModified: ${(err as Error).message}`);
      for (const event of eventArray) {
        event.lastModified = event.updatedAt;
      }
    }
  }
}
