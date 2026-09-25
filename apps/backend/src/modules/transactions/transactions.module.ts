import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsService } from './transactions.service';
import { TransactionPaginationService } from './services/transaction-pagination.service';
import { TransactionsController, EventTransactionsController } from './transactions.controller';
import { Transaction } from './entities/transaction.entity';
import { EventAccessModule } from '../event-access/event-access.module';
import { EventParticipationModule } from '../event-participation/event-participation.module';

@Module({
  // The Event entity is deliberately absent: event access goes through EventAccessModule instead of a
  // second repository over the events table.
  imports: [TypeOrmModule.forFeature([Transaction]), EventAccessModule, EventParticipationModule],
  controllers: [EventTransactionsController, TransactionsController],
  // RequestContextService is not declared here on purpose: it lives in the global RequestContextModule
  // so the middleware and this module's services share the same AsyncLocalStorage instance.
  providers: [TransactionsService, TransactionPaginationService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
