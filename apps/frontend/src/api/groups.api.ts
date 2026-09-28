import { apiRequest } from './client';

export interface Group {
  id: string;
  name: string;
}

export interface GroupMember {
  id: string;
  name: string | null;
  email: string;
  avatar: string | null;
}

export const groupsApi = {
  /** The groups of the current user; every group for the admin. */
  getMine: () => apiRequest<Group[]>('/groups'),
  /** The members of a group, the users that can be added to its events. */
  getMembers: (id: string) => apiRequest<GroupMember[]>(`/groups/${id}/members`),
};
