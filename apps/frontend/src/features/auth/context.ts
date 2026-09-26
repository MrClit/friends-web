import { createContext } from 'react';
import type { AuthContextType } from './types';

// Kept apart from AuthProvider so that AuthContext.tsx exports only a component and
// stays eligible for Fast Refresh.
export const AuthContext = createContext<AuthContextType | undefined>(undefined);
