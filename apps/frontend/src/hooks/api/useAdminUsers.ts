import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminUsersApi, type CreateAdminUserInput, type UpdateAdminUserInput } from '@/api/admin-users.api';
import { queryKeys } from './keys';

export function useAdminUsers() {
  return useQuery({
    queryKey: queryKeys.adminUsers.all,
    queryFn: adminUsersApi.getAll,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAdminUserInput) => adminUsersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers.all });
    },
  });
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAdminUserInput }) => adminUsersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      // Group member lists show the user's name, email and avatar.
      queryClient.invalidateQueries({ queryKey: queryKeys.adminGroups.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
    },
  });
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminUsersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers.all });
      // Deleting a user removes their memberships, which changes member counts and member lists.
      queryClient.invalidateQueries({ queryKey: queryKeys.adminGroups.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
    },
  });
}
