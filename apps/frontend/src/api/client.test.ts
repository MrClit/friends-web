import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiRequest, REFRESH_TOKEN_KEY } from '@/api/client';

vi.mock('@/config/env', () => ({
  ENV: { API_URL: 'http://test.api' },
}));

function mockResponse(status: number, body: unknown, contentType = 'application/json'): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: String(status),
    headers: {
      get: (h: string) => (h === 'content-type' ? contentType : null),
    },
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
  } as unknown as Response;
}

describe('apiRequest', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('unwraps { data } from successful JSON response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse(200, { data: { id: '1' } }));
    const result = await apiRequest<{ id: string }>('/events/1');
    expect(result).toEqual({ id: '1' });
  });

  it('returns undefined for 204 No Content', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 204,
      headers: { get: () => null },
    } as unknown as Response);
    const result = await apiRequest('/events/1');
    expect(result).toBeUndefined();
  });

  it('throws ApiError with status 0 on network failure', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Failed to fetch'));
    await expect(apiRequest('/events')).rejects.toMatchObject({
      status: 0,
      statusText: 'NetworkError',
    });
  });

  it('throws ApiError with JSON message on 404', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse(404, { message: 'Not found' }));
    await expect(apiRequest('/events/missing')).rejects.toMatchObject({
      status: 404,
      message: 'Not found',
    });
  });

  it('throws ApiError with text body on non-JSON error response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse(403, 'Forbidden', 'text/plain'));
    await expect(apiRequest('/events/forbidden')).rejects.toMatchObject({ status: 403 });
  });

  it('throws ApiError with UnexpectedContentType for non-JSON success', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse(200, 'ok', 'text/plain'));
    await expect(apiRequest('/events')).rejects.toMatchObject({
      statusText: 'UnexpectedContentType',
    });
  });

  describe('401 / token refresh', () => {
    it('retries request with new token after successful refresh', async () => {
      localStorage.setItem('token', 'old-token');
      localStorage.setItem(REFRESH_TOKEN_KEY, 'refresh-token');

      vi.mocked(fetch)
        .mockResolvedValueOnce(mockResponse(401, { message: 'Unauthorized' }))
        .mockResolvedValueOnce(mockResponse(200, { data: { accessToken: 'new-token', refreshToken: 'new-refresh' } }))
        .mockResolvedValueOnce(mockResponse(200, { data: { id: '1' } }));

      const result = await apiRequest<{ id: string }>('/events/1');

      expect(result).toEqual({ id: '1' });
      expect(localStorage.getItem('token')).toBe('new-token');
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('removes refresh_token and dispatches auth:logout when refresh endpoint returns non-ok', async () => {
      localStorage.setItem('token', 'old-token');
      localStorage.setItem(REFRESH_TOKEN_KEY, 'refresh-token');

      vi.mocked(fetch)
        .mockResolvedValueOnce(mockResponse(401, { message: 'Unauthorized' }))
        .mockResolvedValueOnce(mockResponse(400, { message: 'Invalid refresh token' }));

      const logoutListener = vi.fn();
      window.addEventListener('auth:logout', logoutListener);

      await expect(apiRequest('/events/1')).rejects.toMatchObject({ status: 401 });

      expect(logoutListener).toHaveBeenCalledTimes(1);
      expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();

      window.removeEventListener('auth:logout', logoutListener);
    });

    it('dispatches auth:logout immediately when no refresh token is stored', async () => {
      localStorage.setItem('token', 'old-token');

      vi.mocked(fetch).mockResolvedValueOnce(mockResponse(401, { message: 'Unauthorized' }));

      const logoutListener = vi.fn();
      window.addEventListener('auth:logout', logoutListener);

      await expect(apiRequest('/events/1')).rejects.toMatchObject({ status: 401 });

      expect(logoutListener).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledTimes(1);

      window.removeEventListener('auth:logout', logoutListener);
    });

    it('does not retry /auth/refresh endpoint on 401', async () => {
      localStorage.setItem('token', 'old-token');
      localStorage.setItem(REFRESH_TOKEN_KEY, 'refresh-token');

      vi.mocked(fetch).mockResolvedValueOnce(mockResponse(401, { message: 'Invalid' }));

      await expect(apiRequest('/auth/refresh')).rejects.toMatchObject({ status: 401 });
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('deduplicates concurrent refresh calls (race condition)', async () => {
      localStorage.setItem('token', 'old-token');
      localStorage.setItem(REFRESH_TOKEN_KEY, 'refresh-token');

      vi.mocked(fetch)
        .mockResolvedValueOnce(mockResponse(401, { message: 'Unauthorized' }))
        .mockResolvedValueOnce(mockResponse(401, { message: 'Unauthorized' }))
        .mockResolvedValueOnce(mockResponse(200, { data: { accessToken: 'new-token', refreshToken: 'new-refresh' } }))
        .mockResolvedValueOnce(mockResponse(200, { data: { id: '1' } }))
        .mockResolvedValueOnce(mockResponse(200, { data: { id: '2' } }));

      await Promise.all([apiRequest('/events/1'), apiRequest('/events/2')]);

      const refreshCalls = vi.mocked(fetch).mock.calls.filter((c) => String(c[0]).includes('/auth/refresh'));
      expect(refreshCalls).toHaveLength(1);
      expect(fetch).toHaveBeenCalledTimes(5);
    });
  });
});
