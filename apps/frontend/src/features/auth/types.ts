// Tipos para autenticación y usuario

export const USER_ROLES = ['admin', 'user'] as const;

export const ADMIN_ROLE = USER_ROLES[0];
export const USER_ROLE = USER_ROLES[1];

export type UserRole = (typeof USER_ROLES)[number];

export function isUserRole(value: string): value is UserRole {
  return USER_ROLES.includes(value as UserRole);
}

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
