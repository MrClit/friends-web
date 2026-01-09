import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { Event } from '../events/entities/event.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { PaginatedTransactionsResponseDto } from './dto/paginated-transactions-response.dto';

const POT_PARTICIPANT_ID = '0';

/**
 * Interface for raw SQL query results with window function
 */
interface RankedTransactionRow {
  id: string;
  event_id: string;
  participant_id: string;
  paymentType: string;
  amount: string;
  title: string;
  date: Date;
  created_at: Date;
  date_rank: number;
  total_dates: number;
}

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  /**
   * Get all transactions for a specific event
   */
  async findByEvent(eventId: string): Promise<Transaction[]> {
    try {
      this.logger.log(`Fetching transactions for event: ${eventId}`);

      // Verify event exists
      const event = await this.eventRepository.findOne({
        where: { id: eventId },
      });

      if (!event) {
        throw new NotFoundException(`Event with ID ${eventId} not found`);
      }

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
  ): Promise<PaginatedTransactionsResponseDto> {
    try {
      this.logger.log(
        `Fetching paginated transactions for event ${eventId}: numberOfDates=${numberOfDates}, offset=${offset}`,
      );

      // Verify event exists
      const event = await this.eventRepository.findOne({
        where: { id: eventId },
      });

      if (!event) {
        throw new NotFoundException(`Event with ID ${eventId} not found`);
      }

      // Single optimized query using window functions
      // DENSE_RANK() groups transactions by unique dates
      const query = `
        WITH RankedTransactions AS (
          SELECT 
            t.id,
            t.title,
            t."paymentType",
            t.amount,
            t.participant_id,
            t.date,
            t.event_id,
            t.created_at,
            DENSE_RANK() OVER (ORDER BY t.date DESC) as date_rank
          FROM transactions t
          WHERE t.event_id = $1
        ),
        DateCounts AS (
          SELECT COUNT(DISTINCT date_rank) as total_dates
          FROM RankedTransactions
        )
        SELECT 
          rt.id,
          rt.title,
          rt."paymentType",
          rt.amount,
          rt.participant_id,
          rt.date,
          rt.event_id,
          rt.created_at,
          rt.date_rank,
          dc.total_dates
        FROM RankedTransactions rt
        CROSS JOIN DateCounts dc
        WHERE rt.date_rank > $2 AND rt.date_rank <= $3
        ORDER BY rt.date DESC, rt.created_at DESC
      `;

      const rawResults: RankedTransactionRow[] = await this.transactionRepository.query(query, [
        eventId,
        offset,
        offset + numberOfDates,
      ]);

      // Extract total dates from first row (all rows have same value)
      const totalDates = rawResults.length > 0 ? rawResults[0].total_dates : 0;

      // Map raw results to Transaction entities
      const transactions = rawResults.map((row) => {
        const transaction = new Transaction();
        transaction.id = row.id;
        transaction.eventId = row.event_id;
        transaction.participantId = row.participant_id;
        transaction.paymentType = row.paymentType as Transaction['paymentType'];
        transaction.amount = parseFloat(row.amount);
        transaction.title = row.title;
        transaction.date = row.date;
        transaction.createdAt = row.created_at;
        return transaction;
      });

      // Calculate unique dates loaded
      const uniqueDatesLoaded = new Set(transactions.map((t) => t.date.toISOString().split('T')[0])).size;

      const hasMore = offset + numberOfDates < totalDates;

      this.logger.log(
        `Paginated result: ${transactions.length} transactions, ${uniqueDatesLoaded} dates loaded, hasMore=${hasMore}`,
      );

      return {
        transactions,
        hasMore,
        totalDates,
        loadedDates: uniqueDatesLoaded,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const err = error as Error;
      this.logger.error(`Failed to fetch paginated transactions for event ${eventId}: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Failed to fetch paginated transactions');
    }
  }

  /**
   * Get a single transaction by ID
   */
  async findOne(id: string): Promise<Transaction> {
    try {
      this.logger.log(`Fetching transaction with ID: ${id}`);
      const transaction = await this.transactionRepository.findOne({
        where: { id },
      });

      if (!transaction) {
        throw new NotFoundException(`Transaction with ID ${id} not found`);
      }

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
  async create(eventId: string, createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    try {
      this.logger.log(`Creating new transaction for event ${eventId}: ${createTransactionDto.title}`);

      // Verify event exists
      const event = await this.eventRepository.findOne({
        where: { id: eventId },
      });

      if (!event) {
        throw new NotFoundException(`Event with ID ${eventId} not found`);
      }

      // Validate participantId
      this.validateParticipantId(createTransactionDto.participantId, event.participants);

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
  async update(id: string, updateTransactionDto: UpdateTransactionDto): Promise<Transaction> {
    try {
      this.logger.log(`Updating transaction with ID: ${id}`);

      // Verify transaction exists
      const transaction = await this.findOne(id);

      // If participantId is being updated, validate it
      if (updateTransactionDto.participantId) {
        const event = await this.eventRepository.findOne({
          where: { id: transaction.eventId },
        });

        if (!event) {
          throw new NotFoundException(`Event with ID ${transaction.eventId} not found`);
        }

        this.validateParticipantId(updateTransactionDto.participantId, event.participants);
      }

      // Update transaction
      await this.transactionRepository.update(id, updateTransactionDto);
      const updatedTransaction = await this.findOne(id);

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
  async remove(id: string): Promise<void> {
    try {
      this.logger.log(`Deleting transaction with ID: ${id}`);

      // Verify transaction exists
      await this.findOne(id);

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

  /**
   * Validate that participantId exists in event participants or is '0' (POT)
   * @throws BadRequestException if participantId is invalid
   */
  private validateParticipantId(participantId: string, participants: Array<{ id: string; name: string }>): void {
    // Allow POT participant
    if (participantId === POT_PARTICIPANT_ID) {
      return;
    }

    // Check if participant exists in event
    const participantExists = participants.some((p) => p.id === participantId);

    if (!participantExists) {
      throw new BadRequestException(
        `Participant with ID ${participantId} does not exist in this event. Valid participant IDs: ${participants.map((p) => p.id).join(', ')} or '0' for POT`,
      );
    }
  }
}
