import { ArgumentsHost, BadRequestException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  const createHost = (url = '/api/test', method = 'GET') => {
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();
    const response = { status, json };
    const request = { url, method };

    const host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => request,
      }),
    } as unknown as ArgumentsHost;

    return { host, response };
  };

  beforeEach(() => {
    filter = new HttpExceptionFilter();
  });

  it('formats HttpException with string response', () => {
    const { host, response } = createHost('/api/users', 'POST');
    const exception = new BadRequestException('Invalid payload');

    filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        path: '/api/users',
        method: 'POST',
        message: 'Invalid payload',
      }),
    );
  });

  it('formats HttpException with array message', () => {
    const { host, response } = createHost('/api/events', 'PATCH');
    const exception = new BadRequestException(['title is required', 'participants must not be empty']);

    filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        path: '/api/events',
        method: 'PATCH',
        message: 'title is required, participants must not be empty',
      }),
    );
  });

  it('returns generic 500 response for unknown errors', () => {
    const { host, response } = createHost('/api/fail', 'GET');

    filter.catch(new Error('unexpected'), host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        path: '/api/fail',
        method: 'GET',
        message: 'Internal server error',
      }),
    );
  });
});
