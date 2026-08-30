import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger as PinoLogger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { configureApp } from './common/bootstrap/configure-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(PinoLogger));

  // Get ConfigService
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;
  const corsOrigin = configService.get<string>('CORS_ORIGIN') || 'http://localhost:5173';

  // CORS Configuration
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Security headers, global prefix, validation, error contract and response envelope
  configureApp(app);

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Friends API')
    .setDescription('REST API for Friends shared expenses management')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Events', 'Event management endpoints')
    .addTag('Event Transactions', 'Transaction endpoints under events')
    .addTag('Transactions', 'Individual transaction operations')
    .addTag('Event Shopping Items', 'Shopping list endpoints under events')
    .addTag('Shopping Items', 'Individual shopping item operations')
    .addTag('Event Calendar', 'Meal calendar endpoints under events')
    .addTag('Calendar Days', 'Individual calendar day operations')
    .addTag('Calendar Meals', 'Lunch and dinner operations, including attendance')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.enableShutdownHooks();
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`Application is running on: http://localhost:${port}/api`);
  logger.log(`Swagger documentation: http://localhost:${port}/api/docs`);
  logger.log(`CORS enabled for: ${corsOrigin}`);
}

void bootstrap();
