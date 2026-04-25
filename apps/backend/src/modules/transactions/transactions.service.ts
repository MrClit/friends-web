import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { Transaction } from './entities/transaction.entity';
import { Event } from '../events/entities/event.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { PaginatedTransactionsResponseDto } from './dto/paginated-transactions-response.dto';
import { ParticipantValidationService } from './services/participant-validation.service';
import { TransactionPaginationService } from './services/transaction-pagination.service';
import { ADMIN_ROLE } from '../users/user-role.constants';
import { RequestContextService } from '../../common/request-context/request-context.service';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    private readonly participantValidationService: ParticipantValidationService,
    private readonly transactionPaginationService: TransactionPaginationService,
    private readonly requestContext: RequestContextService,
  ) {}

  private isAdmin(actor: AuthenticatedUser): boolean {
    return actor.role === ADMIN_ROLE;
  }

  private isUserParticipant(event: Event, userId: string): boolean {
    return (event.participants ?? []).some((participant) => participant.type === 'user' && participant.id === userId);
  }

  private ensureCanAccessEvent(event: Event, actor: AuthenticatedUser): void {
    if (this.isAdmin(actor)) {
      return;
    }

    if (!this.isUserParticipant(event, actor.id)) {
      throw new ForbiddenException(`Access to event ${event.id} is not allowed`);
    }
  }

  private async findEventOrThrow(eventId: string): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    return event;
  }

  private async findTransactionOrThrow(id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({ where: { id } });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return transaction;
  }

  private async ensureCanAccessTransaction(transaction: Transaction, actor: AuthenticatedUser): Promise<void> {
    if (this.isAdmin(actor)) {
      return;
    }

    const event = await this.eventRepository.findOne({ where: { id: transaction.eventId } });
    if (!event) {
      throw new NotFoundException(`Transaction with ID ${transaction.id} not found`);
    }
    if (!this.isUserParticipant(event, actor.id)) {
      throw new ForbiddenException(`Access to transaction ${transaction.id} is not allowed`);
    }
  }

  /**
   * Get all transactions for a specific event
   */
  async findByEvent(eventId: string, actor: AuthenticatedUser): Promise<Transaction[]> {
    try {
      this.logger.log(`Fetching transactions for event: ${eventId}`);

      // Verify event exists
      const event = await this.findEventOrThrow(eventId);
      this.ensureCanAccessEvent(event, actor);

      const transactions = await this.transactionRepository.find({
        where: { eventId },
        order: {
          date: 'DESC',
          createdAt: 'DESC',
        },
      });

      this.logger.log(`Found ${transactions.length} transactions for event ${eventId}`);
      return transactions;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      const err = error as Error;
      this.logger.error(
        { msg: 'Failed to fetch transactions for event', error: err.message, correlationId: this.requestContext.correlationId, actorId: actor.id, eventId },
        err.stack,
      );
      throw new InternalServerErrorException('Failed to fetch transactions');
    }
  }

  /**
   * Get paginated transactions grouped by unique dates
   * Optimized with a single query using PostgreSQL window functions
   * @param eventId - Event ID
   * @param numberOfDates - Number of unique dates to return (validated: 1-50)
   * @param offset - Offset for pagination (validated: >= 0)
   */
  async findByEventPaginated(
    eventId: string,
    numberOfDates: number,
    offset: number,
    actor: AuthenticatedUser,
  ): Promise<PaginatedTransactionsResponseDto> {
    const event = await this.findEventOrThrow(eventId);
    this.ensureCanAccessEvent(event, actor);
    return this.transactionPaginationService.findByEventPaginated(eventId, numberOfDates, offset);
  }

  /**
   * Get a single transaction by ID
   */
  async findOne(id: string, actor: AuthenticatedUser): Promise<Transaction> {
    try {
      this.logger.log(`Fetching transaction with ID: ${id}`);
      const transaction = await this.findTransactionOrThrow(id);
      await this.ensureCanAccessTransaction(transaction, actor);

      return transaction;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      const err = error as Error;
      this.logger.error(
        { msg: 'Failed to fetch transaction', error: err.message, correlationId: this.requestContext.correlationId, actorId: actor.id, transactionId: id },
        err.stack,
      );
      throw new InternalServerErrorException('Failed to fetch transaction');
    }
  }

  /**
   * Create a new transaction
   * Validates that participantId exists in event participants or is '0' (POT)
   */
  async create(
    eventId: string,
    createTransactionDto: CreateTransactionDto,
    actor: AuthenticatedUser,
  ): Promise<Transaction> {
    try {
      this.logger.log(`Creating new transaction for event ${eventId}: ${createTransactionDto.title}`);

      // Verify event exists
      const event = await this.findEventOrThrow(eventId);
      this.ensureCanAccessEvent(event, actor);

      // Validate participantId
      this.participantValidationService.validateParticipantId(
        createTransactionDto.participantId,
        createTransactionDto.paymentType,
        event.participants,
      );

      // Create transaction
      const transaction = this.transactionRepository.create({
        ...createTransactionDto,
        eventId,
      });

      const savedTransaction = await this.transactionRepository.save(transaction);
      this.logger.log(`Transaction created successfully with ID: ${savedTransaction.id}`);
      return savedTransaction;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      const err = error as Error;
      this.logger.error(
        {
          msg: 'Failed to create transaction',
          error: err.message,
          correlationId: this.requestContext.correlationId,
          actorId: actor.id,
          eventId,
          payload: {
            title: createTransactionDto.title,
            paymentType: createTransactionDto.paymentType,
            amount: createTransactionDto.amount,
            participantId: createTransactionDto.participantId,
            date: createTransactionDto.date,
          },
        },
        err.stack,
      );
      throw new InternalServerErrorException('Failed to create transaction');
    }
  }

  /**
   * Update a transaction
   */
  async update(id: string, updateTransactionDto: UpdateTransactionDto, actor: AuthenticatedUser): Promise<Transaction> {
    try {
      this.logger.log(`Updating transaction with ID: ${id}`);

      // Verify transaction exists
      const transaction = await this.findTransactionOrThrow(id);
      await this.ensureCanAccessTransaction(transaction, actor);

      // If participantId or paymentType is being updated, re-validate the combination
      if (updateTransactionDto.participantId || updateTransactionDto.paymentType) {
        const event = await this.eventRepository.findOne({
          where: { id: transaction.eventId },
        });

        if (!event) {
          throw new NotFoundException(`Event with ID ${transaction.eventId} not found`);
        }

        const participantId = updateTransactionDto.participantId ?? transaction.participantId;
        const paymentType = updateTransactionDto.paymentType ?? transaction.paymentType;
        this.participantValidationService.validateParticipantId(participantId, paymentType, event.participants);
      }

      // Update transaction
      await this.transactionRepository.update(id, updateTransactionDto);
      const updatedTransaction = await this.findOne(id, actor);

      this.logger.log(`Transaction ${id} updated successfully`);
      return updatedTransaction;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      const err = error as Error;
      this.logger.error(
        { msg: 'Failed to update transaction', error: err.message, correlationId: this.requestContext.correlationId, actorId: actor.id, transactionId: id, payload: updateTransactionDto },
        err.stack,
      );
      throw new InternalServerErrorException('Failed to update transaction');
    }
  }

  /**
   * Delete a transaction
   */
  async remove(id: string, actor: AuthenticatedUser): Promise<void> {
    try {
      this.logger.log(`Deleting transaction with ID: ${id}`);

      // Verify transaction exists
      const transaction = await this.findTransactionOrThrow(id);
      await this.ensureCanAccessTransaction(transaction, actor);

      // Soft delete transaction
      await this.transactionRepository.softDelete(id);
      this.logger.log(`Transaction ${id} deleted successfully`);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      const err = error as Error;
      this.logger.error(
        { msg: 'Failed to delete transaction', error: err.message, correlationId: this.requestContext.correlationId, actorId: actor.id, transactionId: id },
        err.stack,
      );
      throw new InternalServerErrorException('Failed to delete transaction');
    }
  }
}
