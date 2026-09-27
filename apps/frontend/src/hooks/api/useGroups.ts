import { useQuery } from '@tanstack/react-query';
import { groupsApi } from '@/api/groups.api';
import { queryKeys } from './keys';

export function useGroups() {
  return useQuery({
    queryKey: queryKeys.groups.all,
    queryFn: groupsApi.getMine,
    staleTime: 5 * 60 * 1000,
  });
}

export function groupMembersQueryOptions(groupId: string) {
  return {
    queryKey: queryKeys.groups.members(groupId),
    queryFn: () => groupsApi.getMembers(groupId),
    staleTime: 5 * 60 * 1000,
  };
}

/** Members of a group, fetched only once a group is chosen. */
export function useGroupMembers(groupId: string | undefined) {
  return useQuery({
    ...groupMembersQueryOptions(groupId ?? ''),
    enabled: !!groupId,
  });
}
