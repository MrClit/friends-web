import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from '../events/entities/event.entity';
import { EventAccessService } from './event-access.service';

/**
 * Standalone module so that every consumer of the event access rule imports the same service without
 * coupling to EventsModule. EventsModule already imports TransactionsModule, so hosting the service
 * there would force a circular dependency between the two.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Event])],
  providers: [EventAccessService],
  exports: [EventAccessService],
})
export class EventAccessModule {}
