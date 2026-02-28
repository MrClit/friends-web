// Tipos para autenticación y usuario

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role: UserRole;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: Error | null;
  login: () => void;
  logout: () => void;
  setAuth: (user: User, token: string) => void;
}
