import { apiRequest } from './client';
import type { User } from '@/features/auth/types';

export const usersApi = {
  getAll: () => apiRequest<User[]>('/users'),
};
