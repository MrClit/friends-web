import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreateEvent, useEvent, useUpdateEvent } from '../../../hooks/api/useEvents';
import { useModalForm } from '@/hooks/common';
import { getApiErrorMessage } from '@/shared/utils';
import type { CreateEventInput, EventParticipant, ParticipantReplacement } from '../types';
import { useAuth } from '@/features/auth/useAuth';
import { checkIsDirty } from '../utils/checkIsDirty';

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

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState<string>(DEFAULT_ICON);
  const [participants, setParticipants] = useState<EventParticipant[]>([buildDefaultParticipant(user)]);
  const [participantReplacements, setParticipantReplacements] = useState<ParticipantReplacement[]>([]);

  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();

  const resetForm = useCallback(() => {
    setTitle(event ? event.title : '');
    setDescription(event && event.description ? event.description : '');
    setParticipants(event ? event.participants : [buildDefaultParticipant(user)]);
    setParticipantReplacements([]);
    setIcon(event ? (event.icon ?? DEFAULT_ICON) : DEFAULT_ICON);
  }, [event, user]);

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

    const guestIds = new Set(cleanParticipants.filter((p) => p.type === 'guest').map((p) => p.id));
    const userIds = new Set(cleanParticipants.filter((p) => p.type === 'user').map((p) => p.id));

    return participantReplacements.filter(
      (replacement) => !guestIds.has(replacement.fromGuestId) && userIds.has(replacement.toUserId),
    );
  }, [cleanParticipants, event, participantReplacements]);

  const canSubmit = useMemo(() => !!title.trim() && cleanParticipants.length > 0, [title, cleanParticipants]);

  const isDirty = useMemo(
    () => checkIsDirty({ event, title, description, participants, icon, open, userId: user?.id }),
    [event, title, description, participants, icon, open, user?.id],
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
              modal.setErrorMessage(getApiErrorMessage(error, t));
            },
          },
        );
      } else {
        const createPayload: CreateEventInput = {
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
            modal.setErrorMessage(getApiErrorMessage(error, t));
          },
        });
      }
    },
    [canSubmit, title, description, eventId, cleanParticipants, icon, cleanParticipantReplacements, updateEvent, createEvent, modal, t],
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
    showConfirm: modal.showDiscardConfirm,
    errorMessage: modal.errorMessage,
    isLoading,
    canSubmit,
    isEditMode: !!eventId,
    handleOpenChange: modal.handleOpenChange,
    handleConfirmClose: modal.handleConfirmDiscard,
    handleCancelClose: modal.handleCancelDiscard,
    handleSubmit,
  };
}
