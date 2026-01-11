import { ApiProperty } from '@nestjs/swagger';

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
    description: 'Amount still pending to compensate',
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
}
