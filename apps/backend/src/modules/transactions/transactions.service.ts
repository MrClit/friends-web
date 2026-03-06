import {
  Injectable,
  NotFoundException,
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
      throw new NotFoundException(`Event with ID ${event.id} not found`);
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
    if (!event || !this.isUserParticipant(event, actor.id)) {
      throw new NotFoundException(`Transaction with ID ${transaction.id} not found`);
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
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const err = error as Error;
      this.logger.error(`Failed to fetch transactions for event ${eventId}: ${err.message}`, err.stack);
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
      if (error instanceof NotFoundException) {
        throw error;
      }
      const err = error as Error;
      this.logger.error(`Failed to fetch transaction ${id}: ${err.message}`, err.stack);
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
      this.participantValidationService.validateParticipantId(createTransactionDto.participantId, event.participants);

      // Create transaction
      const transaction = this.transactionRepository.create({
        ...createTransactionDto,
        eventId,
      });

      const savedTransaction = await this.transactionRepository.save(transaction);
      this.logger.log(`Transaction created successfully with ID: ${savedTransaction.id}`);
      return savedTransaction;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const err = error as Error;
      this.logger.error(`Failed to create transaction: ${err.message}`, err.stack);
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

      // If participantId is being updated, validate it
      if (updateTransactionDto.participantId) {
        const event = await this.eventRepository.findOne({
          where: { id: transaction.eventId },
        });

        if (!event) {
          throw new NotFoundException(`Event with ID ${transaction.eventId} not found`);
        }

        this.participantValidationService.validateParticipantId(updateTransactionDto.participantId, event.participants);
      }

      // Update transaction
      await this.transactionRepository.update(id, updateTransactionDto);
      const updatedTransaction = await this.findOne(id, actor);

      this.logger.log(`Transaction ${id} updated successfully`);
      return updatedTransaction;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const err = error as Error;
      this.logger.error(`Failed to update transaction ${id}: ${err.message}`, err.stack);
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

      // Delete transaction
      await this.transactionRepository.delete(id);
      this.logger.log(`Transaction ${id} deleted successfully`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const err = error as Error;
      this.logger.error(`Failed to delete transaction ${id}: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Failed to delete transaction');
    }
  }
}
