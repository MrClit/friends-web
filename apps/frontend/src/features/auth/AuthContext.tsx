import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import { ApiError, REFRESH_TOKEN_KEY, refreshAccessToken, setAccessToken } from '@/api/client';
import { authApi } from '@/api/auth.api';
import type { AuthContextType, AuthProvider, User } from './types';
import { useEventFormModalStore } from '@/shared/store/useEventFormModalStore';
import { useTransactionModalStore } from '@/shared/store/useTransactionModalStore';
import { useDeletingStore } from '@/shared/store/useDeletingStore';
import { useToastStore } from '@/shared/store/useToastStore';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // The access token is read from the API client module, so callers do not pass
  // it in: whoever obtained it has already handed it to setAccessToken.
  const fetchUser = useCallback(async (): Promise<User | null> => {
    try {
      setError(null);
      const nextUser = await authApi.getCurrentUser();
      setUser(nextUser);
      return nextUser;
    } catch (e) {
      setUser(null);

      if (e instanceof ApiError) {
        // A 401 here means the client already tried to refresh and failed, so
        // the session is gone for good.
        if (e.status === 401) {
          setToken(null);
          setAccessToken(null);
          return null;
        }

        setError(e.status === 0 ? new Error('network_error') : new Error(`auth_server_error_${e.status}`));
        return null;
      }

      setError(e instanceof Error ? e : new Error('network_error'));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // The access token lives only in memory: on page load, bootstrap the
    // session from the stored refresh token instead.
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      setLoading(false);
      return;
    }

    void (async () => {
      const newAccessToken = await refreshAccessToken();
      if (!newAccessToken) {
        setLoading(false);
        return;
      }

      setToken(newAccessToken);
      await fetchUser();
    })();
  }, [fetchUser]);

  const login = (provider: AuthProvider = 'google') => {
    window.location.href = authApi.oauthLoginUrl(provider);
  };

  const loginWithGoogle = () => {
    login('google');
  };

  const loginWithMicrosoft = () => {
    login('microsoft');
  };

  const logout = useCallback(() => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    // Fire the revocation before clearing: the API client reads the access token
    // from its own module, and an async function body runs synchronously up to
    // its first await, so the request captures the token before the lines below
    // wipe it.
    void authApi.logout(refreshToken).catch(() => {
      // Intentionally ignore logout API failures to keep local logout immediate.
    });

    setUser(null);
    setToken(null);
    setAccessToken(null);
    localStorage.removeItem(REFRESH_TOKEN_KEY);

    useEventFormModalStore.getState().reset();
    useTransactionModalStore.getState().reset();
    useToastStore.getState().reset();
    useDeletingStore.getState().reset();
  }, []);

  useEffect(() => {
    const handleLogout = () => {
      logout();
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => {
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, [logout]);

  const setAuth = (nextUser: User, nextToken: string) => {
    setUser(nextUser);
    setToken(nextToken);
    setAccessToken(nextToken);
  };

  const refreshUser = useCallback(() => {
    if (!token) {
      return Promise.resolve(null);
    }

    return fetchUser();
  }, [fetchUser, token]);

  const updateUser = useCallback((nextUser: User) => {
    setUser(nextUser);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        loginWithGoogle,
        loginWithMicrosoft,
        logout,
        setAuth,
        refreshUser,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
