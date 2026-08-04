import { describe, it, expect, vi, beforeEach } from 'vitest';

const { apiRequestMock } = vi.hoisted(() => ({ apiRequestMock: vi.fn() }));

vi.mock('@/config/env', () => ({
  ENV: { API_URL: 'http://test.api' },
}));

vi.mock('./client', () => ({
  apiRequest: apiRequestMock,
}));

const { authApi } = await import('./auth.api');

describe('authApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiRequestMock.mockResolvedValue(null);
  });

  it('posts the one-time code to /auth/exchange without the 401 refresh', async () => {
    await authApi.exchangeCode('one-time-code');

    expect(apiRequestMock).toHaveBeenCalledWith('/auth/exchange', {
      method: 'POST',
      body: JSON.stringify({ code: 'one-time-code' }),
      skipAuthRefresh: true,
    });
  });

  it('reads the profile from /auth/me with the default refresh-and-replay', async () => {
    await authApi.getCurrentUser();

    expect(apiRequestMock).toHaveBeenCalledWith('/auth/me');
  });

  it('revokes the refresh token without the 401 refresh', async () => {
    // Opting out matters here: logout clears the refresh token first, so a 401
    // that triggered a refresh would emit auth:logout and recurse.
    await authApi.logout('stored-refresh');

    expect(apiRequestMock).toHaveBeenCalledWith('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: 'stored-refresh' }),
      skipAuthRefresh: true,
    });
  });

  it('still calls the endpoint when no refresh token is stored', async () => {
    await authApi.logout(null);

    expect(apiRequestMock).toHaveBeenCalledWith(
      '/auth/logout',
      expect.objectContaining({ body: JSON.stringify({ refreshToken: null }) }),
    );
  });

  it('builds the OAuth entry point from the validated API URL', () => {
    expect(authApi.oauthLoginUrl('google')).toBe('http://test.api/auth/google');
    expect(authApi.oauthLoginUrl('microsoft')).toBe('http://test.api/auth/microsoft');
  });
});
