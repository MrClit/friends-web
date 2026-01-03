import { Transaction } from '../entities/transaction.entity';

export class PaginatedTransactionsDto {
  transactions: Transaction[];
  hasMore: boolean;
  totalDates: number;
  loadedDates: number;
}
