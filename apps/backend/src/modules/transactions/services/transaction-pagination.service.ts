import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../entities/transaction.entity';
import { Event } from '../../events/entities/event.entity';
import { PaginatedTransactionsResponseDto } from '../dto/paginated-transactions-response.dto';

/**
 * Interface for raw SQL query results with window function
 */
interface RankedTransactionRow {
  id: string;
  event_id: string;
  participant_id: string;
  payment_type: string;
  amount: string;
  title: string;
  date: Date;
  created_at: Date;
  date_rank: number;
  total_dates: number;
}

@Injectable()
export class TransactionPaginationService {
  private readonly logger = new Logger(TransactionPaginationService.name);

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

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

      const query = this.getPaginatedQuery();
      const rawResults: RankedTransactionRow[] = await this.transactionRepository.query(query, [
        eventId,
        offset,
        offset + numberOfDates,
      ]);

      const transactions = this.mapRawResultsToTransactions(rawResults);
      const { totalDates, hasMore, loadedDates } = this.calculatePaginationMetadata(
        rawResults,
        transactions,
        offset,
        numberOfDates,
      );

      this.logger.log(
        `Paginated result: ${transactions.length} transactions, ${loadedDates} dates loaded, hasMore=${hasMore}`,
      );

      return {
        transactions,
        hasMore,
        totalDates,
        loadedDates,
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
   * Get the SQL query for paginated transactions
   */
  private getPaginatedQuery(): string {
    return `
      WITH RankedTransactions AS (
        SELECT
          t.id,
          t.title,
          t.payment_type,
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
        rt.payment_type,
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
  }

  /**
   * Map raw SQL results to Transaction entities
   */
  private mapRawResultsToTransactions(rawResults: RankedTransactionRow[]): Transaction[] {
    return rawResults.map((row) => {
      const transaction = new Transaction();
      transaction.id = row.id;
      transaction.eventId = row.event_id;
      transaction.participantId = row.participant_id;
      transaction.paymentType = row.payment_type as Transaction['paymentType'];
      transaction.amount = parseFloat(row.amount);
      transaction.title = row.title;
      transaction.date = row.date;
      transaction.createdAt = row.created_at;
      return transaction;
    });
  }

  /**
   * Calculate pagination metadata
   */
  private calculatePaginationMetadata(
    rawResults: RankedTransactionRow[],
    transactions: Transaction[],
    offset: number,
    numberOfDates: number,
  ): { totalDates: number; hasMore: boolean; loadedDates: number } {
    const totalDates = rawResults.length > 0 ? rawResults[0].total_dates : 0;
    const uniqueDatesLoaded = new Set(transactions.map((t) => t.date.toISOString().split('T')[0])).size;
    const hasMore = offset + numberOfDates < totalDates;

    return {
      totalDates,
      hasMore,
      loadedDates: uniqueDatesLoaded,
    };
  }
}
