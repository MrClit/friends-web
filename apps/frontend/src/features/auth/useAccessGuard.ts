import { useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import type { UserRole } from './types';

type AccessStatus = 'loading' | 'unauthenticated' | 'unauthorized' | 'authorized';

interface UseAccessGuardOptions {
  allowedRoles?: UserRole[];
}

export function useAccessGuard(options?: UseAccessGuardOptions) {
  const { user, loading, error } = useAuth();
  const location = useLocation();
  const allowedRoles = options?.allowedRoles;

  const isAllowed = !!user && (!allowedRoles || allowedRoles.includes(user.role));

  let status: AccessStatus;
  if (loading) {
    status = 'loading';
  } else if (!user) {
    status = 'unauthenticated';
  } else if (!isAllowed) {
    status = 'unauthorized';
  } else {
    status = 'authorized';
  }

  return {
    user,
    error,
    location,
    status,
    isAllowed,
  };
}
