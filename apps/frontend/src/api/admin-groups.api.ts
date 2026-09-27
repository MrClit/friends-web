import { apiRequest } from './client';

export interface AdminGroup {
  id: string;
  name: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminGroupMember {
  id: string;
  name: string | null;
  email: string;
  avatar: string | null;
  /** Groups the user belongs to, this one included. 1 means removing them leaves them groupless. */
  groupCount: number;
}

interface SuccessResponse {
  success: boolean;
}

export const adminGroupsApi = {
  getAll: () => apiRequest<AdminGroup[]>('/admin/groups'),
  create: (name: string) => apiRequest<AdminGroup>('/admin/groups', { method: 'POST', body: JSON.stringify({ name }) }),
  rename: (id: string, name: string) =>
    apiRequest<AdminGroup>(`/admin/groups/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) }),
  delete: (id: string) => apiRequest<SuccessResponse>(`/admin/groups/${id}`, { method: 'DELETE' }),
  getMembers: (id: string) => apiRequest<AdminGroupMember[]>(`/admin/groups/${id}/members`),
  addMember: (id: string, userId: string) =>
    apiRequest<SuccessResponse>(`/admin/groups/${id}/members/${userId}`, { method: 'PUT' }),
  removeMember: (id: string, userId: string) =>
    apiRequest<SuccessResponse>(`/admin/groups/${id}/members/${userId}`, { method: 'DELETE' }),
};
