import { ENV } from '@/config/env';

const API_BASE = ENV.API_URL;

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
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      response.statusText,
      error.message || `Request failed with status ${response.status}`,
    );
  }

  // Handle 204 No Content responses
  if (response.status === 204) {
    return undefined as T;
  }

  // Backend wraps responses in { data: T }
  const json = await response.json();
  return json.data as T;
}
