import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('API Status')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get API status and welcome message' })
  @ApiResponse({
    status: 200,
    description: 'API is running',
    schema: {
      type: 'string',
      example: 'Friends API is running! 🚀',
    },
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
