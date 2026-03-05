import { ApiProperty } from '@nestjs/swagger';

export class PotExpenseTransactionDto {
  @ApiProperty({ description: 'Transaction ID', example: 'e0f4d89e-a1f1-4f36-b8b0-5b1f32db0dd2' })
  id: string;

  @ApiProperty({ description: 'Transaction title', example: 'Hotel' })
  title: string;

  @ApiProperty({ description: 'Transaction amount', example: 60 })
  amount: number;

  @ApiProperty({ description: 'Transaction date in YYYY-MM-DD format', example: '2026-02-10' })
  date: string;
}

export class BalanceBreakdownInflowsDto {
  @ApiProperty({ description: 'Total inflows to pot', example: 300 })
  total: number;

  @ApiProperty({
    description: 'Contributions grouped by participant (participantId -> amount)',
    example: { user1: 200, user2: 100 },
  })
  contributionsByParticipant: Record<string, number>;
}

export class BalanceBreakdownOutflowsDto {
  @ApiProperty({ description: 'Total outflows from pot', example: 120 })
  total: number;

  @ApiProperty({ description: 'Total compensations paid from pot', example: 40 })
  compensationsTotal: number;

  @ApiProperty({
    description: 'Compensations grouped by participant (participantId -> amount)',
    example: { user1: 40, user2: 0 },
  })
  compensationsByParticipant: Record<string, number>;

  @ApiProperty({ description: 'Total direct expenses paid by pot', example: 80 })
  potExpensesTotal: number;

  @ApiProperty({ type: [PotExpenseTransactionDto] })
  potExpensesTransactions: PotExpenseTransactionDto[];
}

export class BalanceBreakdownReconciliationDto {
  @ApiProperty({ description: 'Inflows value used for reconciliation', example: 300 })
  inflows: number;

  @ApiProperty({ description: 'Outflows value used for reconciliation', example: 120 })
  outflows: number;

  @ApiProperty({ description: 'Final pot balance', example: 180 })
  potBalance: number;

  @ApiProperty({ description: 'Whether inflows - outflows equals potBalance', example: true })
  isConsistent: boolean;
}

export class BalanceBreakdownDto {
  @ApiProperty({ type: BalanceBreakdownInflowsDto })
  inflows: BalanceBreakdownInflowsDto;

  @ApiProperty({ type: BalanceBreakdownOutflowsDto })
  outflows: BalanceBreakdownOutflowsDto;

  @ApiProperty({
    description: 'Net relation with pot by participant (contributions - compensations)',
    example: { user1: 160, user2: 100 },
  })
  participantNetWithPot: Record<string, number>;

  @ApiProperty({ type: BalanceBreakdownReconciliationDto })
  reconciliation: BalanceBreakdownReconciliationDto;
}

export class EventKPIsDto {
  @ApiProperty({
    description: 'Total expenses across all transactions',
    example: 150.5,
  })
  totalExpenses: number;

  @ApiProperty({
    description: 'Total contributions from participants',
    example: 200.0,
  })
  totalContributions: number;

  @ApiProperty({
    description: 'Total compensations paid',
    example: 50.0,
  })
  totalCompensations: number;

  @ApiProperty({
    description: 'Current balance of the shared pot',
    example: 100.0,
  })
  potBalance: number;

  @ApiProperty({
    description: 'Amount still pending to compensate from participant expenses (excludes pot expenses)',
    example: 100.5,
  })
  pendingToCompensate: number;

  @ApiProperty({
    description: 'Balances per participant (participantId -> balance)',
    example: { user1: 50.0, user2: -25.0 },
  })
  participantBalances: Record<string, number>;

  @ApiProperty({
    description: 'Contributions per participant',
    example: { user1: 100.0, user2: 50.0 },
  })
  participantContributions: Record<string, number>;

  @ApiProperty({
    description: 'Expenses per participant',
    example: { user1: 30.0, user2: 20.0 },
  })
  participantExpenses: Record<string, number>;

  @ApiProperty({
    description: 'Compensations per participant',
    example: { user1: 10.0, user2: 5.0 },
  })
  participantCompensations: Record<string, number>;

  @ApiProperty({
    description: 'Pending amounts per participant (expenses - compensations)',
    example: { user1: 20.0, user2: 15.0 },
  })
  participantPending: Record<string, number>;

  @ApiProperty({
    description: 'Expenses from the shared pot',
    example: 25.0,
  })
  potExpenses: number;

  @ApiProperty({
    description: 'Detailed breakdown of pot balance inflows and outflows',
    type: BalanceBreakdownDto,
  })
  balanceBreakdown: BalanceBreakdownDto;
}
