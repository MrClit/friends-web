import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface StandardResponse<T> {
  data: T;
}

/**
 * Global interceptor that wraps all successful responses in a standard format: { data: T }
 * Excludes 204 No Content responses (DELETE operations)
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  StandardResponse<T> | T
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<StandardResponse<T> | T> {
    const response = context.switchToHttp().getResponse<Response>();

    // Don't transform 204 No Content responses (DELETE operations)
    if (response.statusCode === 204) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data: T) => ({
        data,
      })),
    );
  }
}
