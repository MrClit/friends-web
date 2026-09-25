import { Module } from '@nestjs/common';
import { EventParticipationService } from './event-participation.service';

/**
 * Standalone module so that every consumer of the participant validation rule imports the same service
 * without coupling to EventsModule. EventsModule already imports TransactionsModule, so hosting the
 * service there would force a circular dependency between the two.
 */
@Module({
  providers: [EventParticipationService],
  exports: [EventParticipationService],
})
export class EventParticipationModule {}
