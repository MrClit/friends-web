import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { HttpExceptionFilter } from '../filters/http-exception.filter';
import { TransformInterceptor } from '../interceptors/transform.interceptor';

/**
 * Applies the application configuration shared by the production bootstrap and the test harness:
 * security headers, global prefix, validation, error contract and response envelope.
 *
 * Environment-dependent wiring (CORS, Swagger, listen) stays in `main.ts`, since it relies on
 * runtime configuration that does not apply to the in-memory app used by tests.
 */
export function configureApp(app: INestApplication): void {
  // Security headers first, so they also cover responses produced by later middleware.
  // Helmet's defaults are compatible with the bundled Swagger UI: it loads every script as a
  // same-origin external file, and its inline <style> blocks fall under the default style-src.
  app.use(helmet());

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Enable implicit type conversion
      },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  app.use(cookieParser());
}
