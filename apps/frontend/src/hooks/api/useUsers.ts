import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, type UpdateCurrentUserProfileInput } from '@/api/users.api';
import { queryKeys } from './keys';

export function useUpdateCurrentUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateCurrentUserProfileInput) => usersApi.updateCurrentProfile(data),
    onSuccess: () => {
      // Group member lists show the user's name and avatar.
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
    },
  });
}
