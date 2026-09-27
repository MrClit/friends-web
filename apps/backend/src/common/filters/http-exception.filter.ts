import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : 'Internal server error';

    // Extract message from exception response
    let message: string;
    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null && 'message' in exceptionResponse) {
      message = Array.isArray(exceptionResponse.message)
        ? exceptionResponse.message.join(', ')
        : String(exceptionResponse.message);
    } else {
      message = 'Internal server error';
    }

    // Machine-readable context for the client, such as which users a 422 rejected. Passed through only
    // when the exception carries it, so every other error keeps the exact shape it always had.
    const details =
      typeof exceptionResponse === 'object' && exceptionResponse !== null && 'details' in exceptionResponse
        ? exceptionResponse.details
        : undefined;

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      ...(details !== undefined && { details }),
    };

    // Log error details
    this.logger.error(
      `${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : 'Unknown error',
    );

    response.status(status).json(errorResponse);
  }
}
