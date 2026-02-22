import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/api/users.api';
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
