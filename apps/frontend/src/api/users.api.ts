import { apiRequest } from './client';
import type { User } from '@/features/auth/types';

export interface CurrentUserProfile extends User {
  createdAt: string;
  updatedAt: string;
}

export interface UpdateCurrentUserProfileInput {
  name?: string;
  avatarFile?: File;
}

export const usersApi = {
  getAll: () => apiRequest<User[]>('/users'),
  getCurrentProfile: () => apiRequest<CurrentUserProfile>('/users/me'),
  updateCurrentProfile: (data: UpdateCurrentUserProfileInput) => {
    const formData = new FormData();

    if (typeof data.name === 'string') {
      formData.append('name', data.name);
    }

    if (data.avatarFile) {
      formData.append('avatar', data.avatarFile);
    }

    return apiRequest<CurrentUserProfile>('/users/me', {
      method: 'PATCH',
      body: formData,
    });
  },
};
