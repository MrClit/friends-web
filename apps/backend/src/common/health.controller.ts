import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@ApiTags('Health Check')
@Controller('health')
export class HealthController {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe for orchestration platforms' })
  @ApiResponse({
    status: 200,
    description: 'Application process is alive',
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
      },
    },
  })
  live() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe including database connectivity' })
  @ApiResponse({
    status: 200,
    description: 'Application is ready to serve traffic',
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
  @ApiResponse({ status: 503, description: 'Application is not ready' })
  async ready() {
    try {
      await this.dataSource.query('SELECT 1');

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: {
          connected: true,
        },
      };
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        timestamp: new Date().toISOString(),
        database: {
          connected: false,
        },
      });
    }
  }

  @Get()
  @ApiOperation({ summary: 'Compatibility health check (same as readiness)' })
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
  @ApiResponse({ status: 503, description: 'Application is not ready' })
  check() {
    return this.ready();
  }
}
