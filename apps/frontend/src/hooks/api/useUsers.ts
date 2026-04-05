import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi, type UpdateCurrentUserProfileInput } from '@/api/users.api';
import { queryKeys } from './keys';

/**
 * Query hook to fetch all users for participant selection
 * Usuarios se cachean por 10 minutos (no cambian frecuentemente)
 * La búsqueda es LOCAL en el componente (array.filter)
 *
 * @returns Query result with users list, loading state, and error
 */
export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users.all,
    queryFn: usersApi.getAll,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
}

export function useUpdateCurrentUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateCurrentUserProfileInput) => usersApi.updateCurrentProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
    },
  });
}
