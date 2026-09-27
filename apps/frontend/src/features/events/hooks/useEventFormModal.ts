import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateEvent, useEvent, useUpdateEvent } from '../../../hooks/api/useEvents';
import { groupMembersQueryOptions, useGroups } from '@/hooks/api/useGroups';
import { useModalForm } from '@/hooks/common';
import type { CreateEventInput, EventParticipant, ParticipantReplacement } from '../types';
import { useAuth } from '@/features/auth/useAuth';
import { ADMIN_ROLE } from '@/features/auth/types';
import { checkIsDirty } from '../utils/checkIsDirty';
import { describeEventSaveError } from '../utils/describeEventSaveError';

const DEFAULT_ICON = 'flight';

function buildDefaultParticipant(
  user?: { id?: string; type?: string; name?: string; email?: string } | null,
): EventParticipant {
  return { id: user?.id ?? '', type: 'user', name: user?.name ?? '', email: user?.email ?? '' };
}

interface UseEventFormModalProps {
  open: boolean;
  eventId: string | null;
  onClose: () => void;
}

export function useEventFormModal({ open, eventId, onClose }: UseEventFormModalProps) {
  const { user } = useAuth();
  const { t } = useTranslation('common');

  const { data: event } = useEvent(eventId ?? undefined);
  const { data: groups = [] } = useGroups();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState<string>(DEFAULT_ICON);
  const [participants, setParticipants] = useState<EventParticipant[]>([buildDefaultParticipant(user)]);
  const [participantReplacements, setParticipantReplacements] = useState<ParticipantReplacement[]>([]);
  const [groupId, setGroupId] = useState('');
  // Names of the users a group change dropped from the form, for the warning under the group field.
  const [removedByGroupChange, setRemovedByGroupChange] = useState<string[]>([]);
  // Bumped on every group change and reset, so a members lookup that resolves late is ignored.
  const groupRequestRef = useRef(0);

  const isEditMode = !!eventId;
  const isAdmin = user?.role === ADMIN_ROLE;

  // A user with a single group finds it already chosen; editing falls back to the event's group until the
  // form is seeded.
  const effectiveGroupId = groupId || (isEditMode ? (event?.groupId ?? '') : groups.length === 1 ? groups[0].id : '');

  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();

  const resetForm = useCallback(() => {
    setTitle(event ? event.title : '');
    setDescription(event && event.description ? event.description : '');
    setParticipants(event ? event.participants : [buildDefaultParticipant(user)]);
    setParticipantReplacements([]);
    setIcon(event ? (event.icon ?? DEFAULT_ICON) : DEFAULT_ICON);
    setGroupId(event ? event.groupId : '');
    setRemovedByGroupChange([]);
    groupRequestRef.current += 1;
  }, [event, user]);

  /**
   * Changes the event's group. While creating, the users that are not members of the new group are
   * dropped from the form (guests and the pot stay) and named in a warning. While editing, which only the
   * admin can do, the participants are left alone: the server names whoever does not fit.
   */
  const handleGroupChange = useCallback(
    async (nextGroupId: string) => {
      setGroupId(nextGroupId);
      setRemovedByGroupChange([]);
      const request = ++groupRequestRef.current;
      if (isEditMode || !nextGroupId) return;

      let members;
      try {
        members = await queryClient.fetchQuery(groupMembersQueryOptions(nextGroupId));
      } catch {
        // The selector shows its own state for the group; the server check still guards the save.
        return;
      }
      if (request !== groupRequestRef.current) return;

      const memberIds = new Set(members.map((member) => member.id));
      const fits = (p: EventParticipant) => p.type !== 'user' || memberIds.has(p.id);
      const removed = participants.filter((p) => !fits(p));
      if (removed.length === 0) return;

      setParticipants((prev) => prev.filter(fits));
      setRemovedByGroupChange(removed.map((p) => (p.type === 'user' ? p.name || p.email || p.id : p.id)));
    },
    [isEditMode, queryClient, participants],
  );

  const cleanParticipants = useMemo(() => {
    return participants
      .map((p) => {
        if (p.type === 'guest') {
          return { ...p, name: (p.name || '').trim() };
        }
        return p;
      })
      .filter((p) => {
        if (p.type === 'guest') return Boolean(p.name);
        return true;
      });
  }, [participants]);

  const cleanParticipantReplacements = useMemo(() => {
    if (!event || participantReplacements.length === 0) {
      return [];
    }

    // A replacement asks the backend to migrate the guest's transactions to the user, so it only makes
    // sense against what is persisted: the guest must already exist in the saved event and the user must
    // not (the backend rejects both otherwise). Replacements involving participants that only lived in this
    // edit session are dropped; the user is simply sent as a new participant.
    const persistedGuestIds = new Set(event.participants.filter((p) => p.type === 'guest').map((p) => p.id));
    const persistedUserIds = new Set(event.participants.filter((p) => p.type === 'user').map((p) => p.id));
    const guestIds = new Set(cleanParticipants.filter((p) => p.type === 'guest').map((p) => p.id));
    const userIds = new Set(cleanParticipants.filter((p) => p.type === 'user').map((p) => p.id));

    return participantReplacements.filter(
      (replacement) =>
        persistedGuestIds.has(replacement.fromGuestId) &&
        !persistedUserIds.has(replacement.toUserId) &&
        !guestIds.has(replacement.fromGuestId) &&
        userIds.has(replacement.toUserId),
    );
  }, [cleanParticipants, event, participantReplacements]);

  const canSubmit = useMemo(
    () => !!title.trim() && cleanParticipants.length > 0 && !!effectiveGroupId,
    [title, cleanParticipants, effectiveGroupId],
  );

  const isDirty = useMemo(
    () => checkIsDirty({ event, title, description, participants, groupId, icon, open, userId: user?.id }),
    [event, title, description, participants, groupId, icon, open, user?.id],
  );

  const modal = useModalForm({
    open,
    isDirty,
    resetForm,
    onClose,
  });

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSubmit) return;

      modal.setErrorMessage(null);
      const trimmedTitle = title.trim();
      const trimmedDescription = description.trim();

      if (eventId) {
        updateEvent.mutate(
          {
            id: eventId,
            data: {
              groupId: effectiveGroupId,
              title: trimmedTitle,
              description: trimmedDescription || undefined,
              participants: cleanParticipants,
              icon,
              participantReplacements:
                cleanParticipantReplacements.length > 0 ? cleanParticipantReplacements : undefined,
            },
          },
          {
            onSuccess: () => {
              modal.closeAndReset();
            },
            onError: (error) => {
              modal.setErrorMessage(describeEventSaveError(error, cleanParticipants, t));
            },
          },
        );
      } else {
        const createPayload: CreateEventInput = {
          groupId: effectiveGroupId,
          title: trimmedTitle,
          description: trimmedDescription || undefined,
          participants: cleanParticipants,
          icon,
        };
        createEvent.mutate(createPayload, {
          onSuccess: () => {
            modal.closeAndReset();
          },
          onError: (error) => {
            modal.setErrorMessage(describeEventSaveError(error, cleanParticipants, t));
          },
        });
      }
    },
    [
      canSubmit,
      title,
      description,
      eventId,
      effectiveGroupId,
      cleanParticipants,
      icon,
      cleanParticipantReplacements,
      updateEvent,
      createEvent,
      modal,
      t,
    ],
  );

  const isLoading = createEvent.isPending || updateEvent.isPending;

  return {
    title,
    setTitle,
    description,
    setDescription,
    participants,
    setParticipants,
    participantReplacements,
    setParticipantReplacements,
    icon,
    setIcon,
    groups,
    groupId: effectiveGroupId,
    groupName: event?.group?.name,
    handleGroupChange,
    canChangeGroup: !isEditMode || isAdmin,
    removedByGroupChange,
    showConfirm: modal.showDiscardConfirm,
    errorMessage: modal.errorMessage,
    isLoading,
    canSubmit,
    isEditMode,
    handleOpenChange: modal.handleOpenChange,
    handleConfirmClose: modal.handleConfirmDiscard,
    handleCancelClose: modal.handleCancelDiscard,
    handleSubmit,
  };
}
