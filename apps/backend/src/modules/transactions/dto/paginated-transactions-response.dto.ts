import { ApiProperty } from '@nestjs/swagger';
import { Transaction } from '../entities/transaction.entity';

export class PaginatedTransactionsResponseDto {
  @ApiProperty({ type: [Transaction], description: 'Transactions for the loaded date pages' })
  transactions: Transaction[];

  @ApiProperty({ description: 'Whether more date pages are available', example: true })
  hasMore: boolean;

  @ApiProperty({ description: 'Total number of unique dates with transactions', example: 10 })
  totalDates: number;

  @ApiProperty({ description: 'Number of unique dates currently loaded', example: 3 })
  loadedDates: number;
}
