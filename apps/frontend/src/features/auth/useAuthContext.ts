import { use } from 'react';
import { AuthContext } from './context';

export function useAuthContext() {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}
