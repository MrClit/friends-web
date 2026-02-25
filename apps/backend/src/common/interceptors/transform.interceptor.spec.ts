import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of, lastValueFrom } from 'rxjs';
import { TransformInterceptor } from './transform.interceptor';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<unknown>;

  const createContext = (statusCode: number): ExecutionContext => {
    const response = { statusCode };
    return {
      switchToHttp: () => ({
        getResponse: () => response,
      }),
    } as unknown as ExecutionContext;
  };

  const createCallHandler = <T>(value: T): CallHandler<T> => ({
    handle: () => of(value),
  });

  beforeEach(() => {
    interceptor = new TransformInterceptor();
  });

  it('wraps successful responses as { data } when status is not 204', async () => {
    const context = createContext(200);
    const next = createCallHandler({ id: '1', title: 'Test' });

    const result = await lastValueFrom(interceptor.intercept(context, next));

    expect(result).toEqual({
      data: { id: '1', title: 'Test' },
    });
  });

  it('does not wrap response for 204 No Content', async () => {
    const context = createContext(204);
    const next = createCallHandler(undefined);

    const result = await lastValueFrom(interceptor.intercept(context, next));

    expect(result).toBeUndefined();
  });
});
