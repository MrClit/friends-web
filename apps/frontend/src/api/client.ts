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
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
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
    return undefined as T;
  }

  // Backend wraps responses in { data: T }, assume JSON
  if (contentType.includes('application/json')) {
    const json = await response.json();
    return json.data as T;
  } else {
    // Fallback to text if not JSON
    const text = await response.text();
    return text as unknown as T; // This might not be ideal, but for robustness
  }
}
