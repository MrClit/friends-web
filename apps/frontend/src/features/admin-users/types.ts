import type { UserRole } from '@/features/auth/types';

export interface CreateAdminUserFormData {
  email: string;
  role: UserRole;
}

export interface EditAdminUserFormData {
  email: string;
  name: string;
  avatar: string;
  role: UserRole;
}

export const EMPTY_CREATE_ADMIN_USER_FORM: CreateAdminUserFormData = {
  email: '',
  role: 'user',
};

export const EMPTY_EDIT_ADMIN_USER_FORM: EditAdminUserFormData = {
  email: '',
  name: '',
  avatar: '',
  role: 'user',
};
