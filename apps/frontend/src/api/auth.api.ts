import { ENV } from '@/config/env';
import { apiRequest } from './client';
import type { AuthProvider, User } from '@/features/auth/types';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Auth API endpoints
 * All methods use the apiRequest wrapper for consistent error handling
 */
export const authApi = {
  /**
   * Redeem the one-time OAuth callback code for a token pair
   * @param code - One-time exchange code from the callback URL
   * @returns Access and refresh tokens
   */
  exchangeCode: (code: string) =>
    apiRequest<AuthTokens>('/auth/exchange', {
      method: 'POST',
      body: JSON.stringify({ code }),
      // No session exists yet, so a 401 here means the code is bad, not that
      // the access token expired.
      skipAuthRefresh: true,
    }),

  /**
   * Get the authenticated user's profile
   * @returns Current user
   */
  getCurrentUser: () => apiRequest<User>('/auth/me'),

  /**
   * Revoke the refresh token server-side
   * @param refreshToken - Refresh token to revoke, if any is stored
   * @returns void
   */
  logout: (refreshToken: string | null) =>
    apiRequest<null>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
      skipAuthRefresh: true,
    }),

  /**
   * Build the OAuth entry point URL for a provider
   * @param provider - OAuth provider to authenticate with
   * @returns Absolute URL to redirect the browser to
   */
  oauthLoginUrl: (provider: AuthProvider) => `${ENV.API_URL}/auth/${provider}`,
};
