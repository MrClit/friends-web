import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { Event } from './entities/event.entity';
import { TransactionsModule } from '../transactions/transactions.module';
import { EventKPIsService } from './services/event-kpis.service';

@Module({
  imports: [TypeOrmModule.forFeature([Event]), TransactionsModule],
  controllers: [EventsController],
  providers: [EventsService, EventKPIsService],
  exports: [EventsService],
})
export class EventsModule {}
