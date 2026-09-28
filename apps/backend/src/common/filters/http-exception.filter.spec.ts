import { ArgumentsHost, BadRequestException, HttpStatus, UnprocessableEntityException } from '@nestjs/common';
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

  it('passes details through when the exception carries them', () => {
    const { host, response } = createHost('/api/events', 'POST');
    const exception = new UnprocessableEntityException({
      message: 'Users u1 are not members of group g1',
      details: { userIds: ['u1'] },
    });

    filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 422,
        message: 'Users u1 are not members of group g1',
        details: { userIds: ['u1'] },
      }),
    );
  });

  it('leaves details out when the exception has none', () => {
    const { host, response } = createHost();

    filter.catch(new BadRequestException('Invalid payload'), host);

    const [body] = response.json.mock.calls[0] as [Record<string, unknown>];
    expect(body).not.toHaveProperty('details');
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
