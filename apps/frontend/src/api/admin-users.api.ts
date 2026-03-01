import { apiRequest } from './client';
import type { User, UserRole } from '@/features/auth/types';

export interface CreateAdminUserInput {
  email: string;
  role: UserRole;
}

export interface UpdateAdminUserInput {
  email?: string;
  name?: string;
  avatar?: string;
  role?: UserRole;
}

export interface DeleteAdminUserResponse {
  success: boolean;
}

export const adminUsersApi = {
  getAll: () => apiRequest<User[]>('/admin/users'),
  create: (data: CreateAdminUserInput) =>
    apiRequest<User>('/admin/users', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: UpdateAdminUserInput) =>
    apiRequest<User>(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiRequest<DeleteAdminUserResponse>(`/admin/users/${id}`, {
      method: 'DELETE',
    }),
};
