import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import type { AuthContextType, AuthProvider, User } from './types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'token';

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
        localStorage.removeItem(TOKEN_KEY);
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
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (!storedToken) {
      setLoading(false);
      return;
    }

    setToken(storedToken);
    void fetchUser(storedToken);
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

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
  };

  const setAuth = (nextUser: User, nextToken: string) => {
    setUser(nextUser);
    setToken(nextToken);
    localStorage.setItem(TOKEN_KEY, nextToken);
    void fetchUser(nextToken);
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
