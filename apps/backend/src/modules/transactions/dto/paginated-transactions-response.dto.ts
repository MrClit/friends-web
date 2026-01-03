import { Transaction } from '../entities/transaction.entity';

/**
 * DTO for paginated transactions response (OUTPUT)
 * Contains transactions array and pagination metadata
 */
export class PaginatedTransactionsResponseDto {
  transactions: Transaction[];
  hasMore: boolean;
  totalDates: number;
  loadedDates: number;
}
