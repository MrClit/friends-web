import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminGroupsApi } from '@/api/admin-groups.api';
import { queryKeys } from './keys';

export function useAdminGroups() {
  return useQuery({
    queryKey: queryKeys.adminGroups.all,
    queryFn: adminGroupsApi.getAll,
    staleTime: 2 * 60 * 1000,
  });
}

export function useAdminGroupMembers(groupId: string) {
  return useQuery({
    queryKey: queryKeys.adminGroups.members(groupId),
    queryFn: () => adminGroupsApi.getMembers(groupId),
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Every mutation invalidates the whole `admin-groups` prefix: the list carries the member counts, and the
 * member lists of other groups carry each user's group count, so any change can move numbers elsewhere.
 */
function useInvalidateAdminGroups() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.adminGroups.all });
}

export function useCreateAdminGroup() {
  const invalidate = useInvalidateAdminGroups();

  return useMutation({
    mutationFn: (name: string) => adminGroupsApi.create(name),
    onSuccess: invalidate,
  });
}

export function useRenameAdminGroup() {
  const invalidate = useInvalidateAdminGroups();

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => adminGroupsApi.rename(id, name),
    onSuccess: invalidate,
  });
}

export function useDeleteAdminGroup() {
  const invalidate = useInvalidateAdminGroups();

  return useMutation({
    mutationFn: (id: string) => adminGroupsApi.delete(id),
    onSuccess: invalidate,
  });
}

export function useAddAdminGroupMember() {
  const invalidate = useInvalidateAdminGroups();

  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) => adminGroupsApi.addMember(groupId, userId),
    onSuccess: invalidate,
  });
}

export function useRemoveAdminGroupMember() {
  const invalidate = useInvalidateAdminGroups();

  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
      adminGroupsApi.removeMember(groupId, userId),
    onSuccess: invalidate,
  });
}
