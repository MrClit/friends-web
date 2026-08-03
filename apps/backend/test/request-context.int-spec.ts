import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from '@nestjs/passport';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { RequestContextModule } from '../src/common/request-context/request-context.module';
import { RequestContextService } from '../src/common/request-context/request-context.service';
import type { AuthenticatedUser } from '../src/common/types/authenticated-user.type';
import { EventsModule } from '../src/modules/events/events.module';
import { USER_ROLE } from '../src/modules/users/user-role.constants';
import { TransactionsModule } from '../src/modules/transactions/transactions.module';
import { TransactionsService } from '../src/modules/transactions/transactions.service';
import { applyAppTestConfig } from './utils/test-app-config';

/**
 * Guards the wiring of RequestContextService: the middleware writes the correlation id into an
 * AsyncLocalStorage, and a service must read it back from the very same instance. Providing the
 * service in more than one module used to create two stores, leaving `correlationId` undefined in
 * every log line that reported it.
 */
describe('Request context propagation (integration)', () => {
  const EVENT_ID = '00000000-0000-0000-0000-000000000001';

  const testUser: AuthenticatedUser = {
    id: '00000000-0000-0000-0000-0000000000aa',
    email: 'context@test.com',
    role: USER_ROLE,
  };

  let app: INestApplication;
  let transactionsService: TransactionsService;
  /** The instance Nest injected into the service, which is what the log lines actually read. */
  let injectedContext: RequestContextService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
          req.user = testUser;
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    applyAppTestConfig(app);
    await app.init();

    transactionsService = app.get(TransactionsService);
    injectedContext = Reflect.get(transactionsService, 'requestContext') as RequestContextService;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  /**
   * Runs a request against a real guarded route and returns the correlation id the service saw
   * while handling it. The service method is stubbed so the test needs no database rows.
   */
  const captureCorrelationIdDuringRequest = async (correlationId?: string): Promise<string | undefined> => {
    let observed: string | undefined;

    jest.spyOn(transactionsService, 'findByEvent').mockImplementation(() => {
      observed = injectedContext.correlationId;
      return Promise.resolve([]);
    });

    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
    const pendingRequest = request(httpServer).get(`/api/events/${EVENT_ID}/transactions`);

    if (correlationId !== undefined) {
      void pendingRequest.set('X-Correlation-Id', correlationId);
    }

    const response = await pendingRequest.expect(200);
    expect(response.headers['x-correlation-id']).toBeDefined();

    return observed;
  };

  it('is declared by no module other than the global RequestContextModule', () => {
    // Re-declaring the provider anywhere gives that module a private AsyncLocalStorage, which is
    // how the correlation id used to get lost between the middleware and the service.
    const declaringModules = [AppModule, EventsModule, TransactionsModule].filter((module) => {
      const providers = (Reflect.getMetadata('providers', module) as unknown[] | undefined) ?? [];
      return providers.includes(RequestContextService);
    });

    expect(declaringModules).toEqual([]);
    expect(Reflect.getMetadata('providers', RequestContextModule)).toContain(RequestContextService);
  });

  it('exposes the X-Correlation-Id header value inside the service handling the request', async () => {
    const correlationId = 'fixed-correlation-id-for-test';

    const observed = await captureCorrelationIdDuringRequest(correlationId);

    expect(observed).toBe(correlationId);
  });

  it('falls back to a generated correlation id when the header is absent', async () => {
    const observed = await captureCorrelationIdDuringRequest();

    expect(observed).toEqual(expect.any(String));
  });
});
