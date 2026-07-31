import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import { REFRESH_TOKEN_KEY, refreshAccessToken, setAccessToken } from '@/api/client';
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

  const fetchUser = useCallback(async (jwt: string): Promise<User | null> => {
    try {
      setError(null);
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/auth/me`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });

      if (res.ok) {
        const response = (await res.json()) as { data: User };
        setUser(response.data);
        return response.data;
      }

      if (res.status === 401) {
        setUser(null);
        setToken(null);
        setAccessToken(null);
        return null;
      }

      setUser(null);
      setError(new Error(`auth_server_error_${res.status}`));
      return null;
    } catch (e) {
      setUser(null);
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
      await fetchUser(newAccessToken);
    })();
  }, [fetchUser]);

  const login = (provider: AuthProvider = 'google') => {
    window.location.href = `${import.meta.env.VITE_API_URL || '/api'}/auth/${provider}`;
  };

  const loginWithGoogle = () => {
    login('google');
  };

  const loginWithMicrosoft = () => {
    login('microsoft');
  };

  const logout = useCallback(() => {
    const currentToken = token;
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    setUser(null);
    setToken(null);
    setAccessToken(null);
    localStorage.removeItem(REFRESH_TOKEN_KEY);

    useEventFormModalStore.getState().reset();
    useTransactionModalStore.getState().reset();
    useToastStore.getState().reset();
    useDeletingStore.getState().reset();

    void fetch(`${import.meta.env.VITE_API_URL || '/api'}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
      },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => {
      // Intentionally ignore logout API failures to keep local logout immediate.
    });
  }, [token]);

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

    return fetchUser(token);
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
