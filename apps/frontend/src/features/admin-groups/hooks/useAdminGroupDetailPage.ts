import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ApiError } from '@/api/client';
import type { AdminGroup, AdminGroupMember } from '@/api/admin-groups.api';
import {
  useAddAdminGroupMember,
  useAdminGroupMembers,
  useAdminGroups,
  useRemoveAdminGroupMember,
} from '@/hooks/api/useAdminGroups';
import { useToastStore } from '@/shared/store/useToastStore';
import { getApiErrorMessage } from '@/shared/utils';

interface UseAdminGroupDetailPageResult {
  group: AdminGroup | undefined;
  members: AdminGroupMember[];
  isLoading: boolean;
  isNotFound: boolean;
  loadError: unknown;
  isMutating: boolean;
  confirmingRemoval: AdminGroupMember | null;
  addMember: (userId: string) => Promise<void>;
  requestRemove: (member: AdminGroupMember) => Promise<void>;
  cancelRemove: () => void;
  confirmRemove: () => Promise<void>;
}

export function useAdminGroupDetailPage(groupId: string): UseAdminGroupDetailPageResult {
  const { t } = useTranslation(['adminGroups', 'common']);
  const addToast = useToastStore((state) => state.addToast);

  const groupsQuery = useAdminGroups();
  const membersQuery = useAdminGroupMembers(groupId);
  const addMemberMutation = useAddAdminGroupMember();
  const removeMemberMutation = useRemoveAdminGroupMember();

  const [confirmingRemoval, setConfirmingRemoval] = useState<AdminGroupMember | null>(null);

  const group = groupsQuery.data?.find((candidate) => candidate.id === groupId);
  const membersNotFound = membersQuery.error instanceof ApiError && membersQuery.error.status === 404;
  // The group comes from the list, so a loaded list without it means the group is gone.
  const isNotFound = membersNotFound || (groupsQuery.isSuccess && !group);
  const isLoading = groupsQuery.isPending || membersQuery.isPending;
  const loadError = isNotFound ? null : (groupsQuery.error ?? membersQuery.error);

  const addMember = async (userId: string) => {
    try {
      await addMemberMutation.mutateAsync({ groupId, userId });
      addToast({ type: 'success', message: t('detail.addSuccess', { ns: 'adminGroups' }), duration: 3500 });
    } catch (error) {
      addToast({
        type: 'error',
        message: t('detail.addError', { ns: 'adminGroups' }),
        description: getApiErrorMessage(error, t),
        duration: 6000,
      });
    }
  };

  const removeMember = async (member: AdminGroupMember) => {
    try {
      await removeMemberMutation.mutateAsync({ groupId, userId: member.id });
      addToast({ type: 'success', message: t('detail.removeSuccess', { ns: 'adminGroups' }), duration: 3500 });
    } catch (error) {
      addToast({
        type: 'error',
        message: t('detail.removeError', { ns: 'adminGroups' }),
        description: getApiErrorMessage(error, t),
        duration: 6000,
      });
    }
  };

  /**
   * Removing is undone by adding the user back, so it only asks first when this is the user's only group:
   * that removal is the one with a consequence, since a groupless user cannot create events.
   */
  const requestRemove = async (member: AdminGroupMember) => {
    if (member.groupCount <= 1) {
      setConfirmingRemoval(member);
      return;
    }
    await removeMember(member);
  };

  const cancelRemove = () => setConfirmingRemoval(null);

  const confirmRemove = async () => {
    if (!confirmingRemoval) {
      return;
    }
    const member = confirmingRemoval;
    setConfirmingRemoval(null);
    await removeMember(member);
  };

  return {
    group,
    members: membersQuery.data ?? [],
    isLoading,
    isNotFound,
    loadError,
    isMutating: addMemberMutation.isPending || removeMemberMutation.isPending,
    confirmingRemoval,
    addMember,
    requestRemove,
    cancelRemove,
    confirmRemove,
  };
}
