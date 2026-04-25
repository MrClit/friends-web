import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreateEvent } from '../../../hooks/api/useEvents';
import { useModalForm } from '@/hooks/common';
import { getApiErrorMessage } from '@/shared/utils';
import type { CreateEventInput, Event, EventFormData, EventParticipant, ParticipantReplacement } from '../types';
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
  event?: Event;
  onClose: () => void;
  onSubmit?: (event: EventFormData) => void;
}

export function useEventFormModal({ open, event, onClose, onSubmit }: UseEventFormModalProps) {
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState<string>(event?.icon ?? DEFAULT_ICON);
  const [participants, setParticipants] = useState<EventParticipant[]>([buildDefaultParticipant(user)]);
  const [participantReplacements, setParticipantReplacements] = useState<ParticipantReplacement[]>([]);
  const createEvent = useCreateEvent();
  const { t } = useTranslation('common');

  // Centralized reset function to avoid duplication
  const resetForm = useCallback(() => {
    setTitle(event ? event.title : '');
    setDescription(event && event.description ? event.description : '');
    setParticipants(event ? event.participants : [buildDefaultParticipant(user)]);
    setParticipantReplacements([]);
    setIcon(event ? (event.icon ?? DEFAULT_ICON) : DEFAULT_ICON);
  }, [event, user]);

  // Memoize clean participants (trim and filter empty)
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

  // Keep only replacements that still match the in-memory participants state
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

  // Memoize form validation
  const canSubmit = useMemo(() => !!title.trim() && cleanParticipants.length > 0, [title, cleanParticipants]);

  // Check if form has unsaved changes
  const isDirty = useMemo(
    () => checkIsDirty({ event, title, description, participants, icon, open, userId: user?.id }),
    [event, title, description, participants, icon, open, user?.id],
  );

  // Shared modal lifecycle (discard confirmation, error, reset-on-open)
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
      const eventData: EventFormData = {
        id: event?.id,
        title: trimmedTitle,
        description: trimmedDescription || undefined,
        participants: cleanParticipants,
        icon,
        participantReplacements: cleanParticipantReplacements.length > 0 ? cleanParticipantReplacements : undefined,
      };

      if (onSubmit) {
        // Custom submit handler (used for edit mode)
        onSubmit(eventData);
        modal.closeAndReset();
      } else {
        const createPayload: CreateEventInput = {
          title: trimmedTitle,
          description: trimmedDescription || undefined,
          participants: cleanParticipants,
          icon,
        };
        // Create event via API
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
    [
      canSubmit,
      title,
      description,
      event?.id,
      cleanParticipants,
      icon,
      cleanParticipantReplacements,
      onSubmit,
      modal,
      createEvent,
      t,
    ],
  );

  const isLoading = createEvent.isPending;

  return {
    // State
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
    // Computed
    isLoading,
    canSubmit,
    // Handlers
    handleOpenChange: modal.handleOpenChange,
    handleConfirmClose: modal.handleConfirmDiscard,
    handleCancelClose: modal.handleCancelDiscard,
    handleSubmit,
  };
}
