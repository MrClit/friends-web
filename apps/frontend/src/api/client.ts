import { ENV } from '@/config/env';

const API_BASE = ENV.API_URL;
let refreshPromise: Promise<string | null> | null = null;

export const REFRESH_TOKEN_KEY = 'refresh_token';

interface ApiRequestInit extends RequestInit {
  _retried?: boolean;
}

function getAuthToken() {
  return localStorage.getItem('token');
}

function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  refreshPromise = fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
    .then(async (response) => {
      if (!response.ok) {
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        return null;
      }

      const body = (await response.json()) as { data?: { accessToken?: string; refreshToken?: string } };
      const newRefreshToken = body.data?.refreshToken;
      if (newRefreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
      }
      return body.data?.accessToken ?? null;
    })
    .catch(() => null)
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

/**
 * Custom API Error class with status information
 */
export class ApiError extends Error {
  status: number;
  statusText: string;

  constructor(status: number, statusText: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
  }
}

/**
 * Generic API request wrapper with error handling and response parsing
 * @param endpoint - API endpoint (e.g., '/events')
 * @param options - Fetch options (method, headers, body, etc.)
 * @returns Parsed response data
 * @throws ApiError on request failure
 */
export async function apiRequest<T>(endpoint: string, options?: ApiRequestInit): Promise<T> {
  const requestOptions = options ?? {};
  const { _retried: hasRetried = false, ...baseOptions } = requestOptions;

  let response: Response;
  const token = getAuthToken();
  const isFormData = typeof FormData !== 'undefined' && baseOptions.body instanceof FormData;

  try {
    const headers = new Headers(baseOptions.headers);

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    if (!isFormData && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    response = await fetch(`${API_BASE}${endpoint}`, {
      ...baseOptions,
      headers,
    });
  } catch (e) {
    throw new ApiError(0, 'NetworkError', (e as Error).message);
  }

  const contentType = response.headers.get('content-type') || '';

  if (!response.ok) {
    if (response.status === 401 && !hasRetried && endpoint !== '/auth/refresh') {
      const newToken = await refreshAccessToken();

      if (newToken) {
        localStorage.setItem('token', newToken);
        return apiRequest<T>(endpoint, {
          ...baseOptions,
          _retried: true,
        });
      }

      window.dispatchEvent(new Event('auth:logout'));
    }

    let errorMessage: string;
    if (contentType.includes('application/json')) {
      const error = await response.json().catch(() => ({}));
      errorMessage = error.message || `Request failed with status ${response.status}`;
    } else {
      const text = await response.text();
      errorMessage = text || `Request failed with status ${response.status}`;
    }
    throw new ApiError(response.status, response.statusText, errorMessage);
  }

  // Handle 204 No Content responses
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  // Backend wraps responses in { data: T }, assume JSON
  if (contentType.includes('application/json')) {
    const json = await response.json();
    return json.data as T;
  } else {
    throw new ApiError(
      response.status,
      'UnexpectedContentType',
      `Expected JSON response but received: ${contentType || 'unknown'}`,
    );
  }
}
