import { useGroups } from '@/hooks/api/useGroups';

/**
 * Whether the current user belongs to no group, which means they cannot create events. Only true once the
 * groups have loaded, so the create entry points do not flicker to disabled while loading.
 */
export function useHasNoGroup(): boolean {
  const { data: groups, isSuccess } = useGroups();
  return isSuccess && groups.length === 0;
}
