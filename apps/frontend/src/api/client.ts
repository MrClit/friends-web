import { ENV } from '@/config/env';

const API_BASE = ENV.API_URL;

function getAuthToken() {
  // Intenta obtener el token desde localStorage
  return localStorage.getItem('token');
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
export async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  let response: Response;
  const token = getAuthToken();
  const isFormData = typeof FormData !== 'undefined' && options?.body instanceof FormData;

  try {
    const headers = new Headers(options?.headers);

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    if (!isFormData && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (e) {
    throw new ApiError(0, 'NetworkError', (e as Error).message);
  }

  const contentType = response.headers.get('content-type') || '';

  if (!response.ok) {
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
