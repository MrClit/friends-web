import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsService } from './transactions.service';
import { ParticipantValidationService } from './services/participant-validation.service';
import { TransactionPaginationService } from './services/transaction-pagination.service';
import { TransactionsController, EventTransactionsController } from './transactions.controller';
import { Transaction } from './entities/transaction.entity';
import { Event } from '../events/entities/event.entity';
import { RequestContextService } from '../../common/request-context/request-context.service';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, Event])],
  controllers: [EventTransactionsController, TransactionsController],
  providers: [TransactionsService, ParticipantValidationService, TransactionPaginationService, RequestContextService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
