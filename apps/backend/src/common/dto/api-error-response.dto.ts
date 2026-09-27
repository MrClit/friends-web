import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/api/events' })
  path: string;

  @ApiProperty({ example: 'POST' })
  method: string;

  @ApiProperty({ example: 'Validation failed' })
  message: string;

  @ApiPropertyOptional({
    description: 'Machine-readable context, present only on some errors',
    example: { userIds: ['8f14e45f-ceea-467a-9f3c-2bd2e6c1a3d4'] },
  })
  details?: Record<string, unknown>;
}
