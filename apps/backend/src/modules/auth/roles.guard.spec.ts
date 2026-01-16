import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createContext(userRole?: string, rolesMeta?: string[]) {
    const handler = () => {};
    class DummyClass {}
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(rolesMeta as any);

    const ctx = {
      getHandler: () => handler,
      getClass: () => DummyClass,
      switchToHttp: () => ({
        getRequest: () => ({ user: userRole ? { role: userRole } : undefined }),
        getResponse: () => ({}),
        getNext: () => ({}),
      }),
    } as unknown as ExecutionContext;

    return ctx;
  }

  it('allows when no roles are required', () => {
    const ctx = createContext('user', undefined);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('denies when user has no role', () => {
    const ctx = createContext(undefined, ['admin']);
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('allows when user role matches required', () => {
    const ctx = createContext('admin', ['admin']);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('denies when user role does not match', () => {
    const ctx = createContext('user', ['admin']);
    expect(guard.canActivate(ctx)).toBe(false);
  });
});
