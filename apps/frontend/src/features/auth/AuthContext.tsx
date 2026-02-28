import { createContext, useState, useEffect, type ReactNode } from 'react';
import type { AuthContextType, User } from './types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Cargar token y usuario al iniciar
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (storedToken) {
      setToken(storedToken);
      fetchUser(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (jwt: string) => {
    try {
      setError(null);
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/auth/me`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (res.ok) {
        const response = await res.json();
        setUser(response.data);
      } else if (res.status === 401) {
        // Token expired or invalid — clear auth silently
        setUser(null);
        setToken(null);
        localStorage.removeItem(TOKEN_KEY);
      } else {
        // Server error — surface to user
        setUser(null);
        setError(new Error(`auth_server_error_${res.status}`));
      }
    } catch (e) {
      // Network error — surface to user, keep token for retry
      setUser(null);
      setError(e instanceof Error ? e : new Error('network_error'));
    } finally {
      setLoading(false);
    }
  };

  const login = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || '/api'}/auth/google`;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    // Opcional: llamar a /auth/logout en backend
  };

  const setAuth = (user: User, token: string) => {
    setUser(user);
    setToken(token);
    localStorage.setItem(TOKEN_KEY, token);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, logout, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
