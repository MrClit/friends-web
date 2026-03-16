import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { Event } from './entities/event.entity';
import { User } from '../users/user.entity';
import { TransactionsModule } from '../transactions/transactions.module';
import { EventKPIsService } from './services/event-kpis.service';
import { EventQueryService } from './services/event-query.service';
import { EventParticipantsService } from './services/event-participants.service';

@Module({
  imports: [TypeOrmModule.forFeature([Event, User]), TransactionsModule],
  controllers: [EventsController],
  providers: [EventsService, EventKPIsService, EventQueryService, EventParticipantsService],
  exports: [EventsService],
})
export class EventsModule {}
