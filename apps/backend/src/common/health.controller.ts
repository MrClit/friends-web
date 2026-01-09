import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@ApiTags('Health Check')
@Controller('health')
export class HealthController {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  @Get()
  @ApiOperation({ summary: 'Check API and database health status' })
  @ApiResponse({
    status: 200,
    description: 'Health check performed successfully',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          example: 'ok',
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          example: '2026-01-03T12:00:00.000Z',
        },
        database: {
          type: 'object',
          properties: {
            connected: {
              type: 'boolean',
              example: true,
            },
          },
        },
      },
    },
  })
  check() {
    const isConnected = this.dataSource.isInitialized;

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        connected: isConnected,
      },
    };
  }
}
