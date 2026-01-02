import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  @Get()
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
