import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreateEvent } from '../../../hooks/api/useEvents';
import { useModalForm } from '@/hooks/common';
import type { CreateEventInput, Event, EventFormData, EventParticipant } from '../types';
import { useAuth } from '@/features/auth/useAuth';

const DEFAULT_ICON = 'flight';

function buildDefaultParticipant(
  user?: { id?: string; type?: string; name?: string; email?: string } | null,
): EventParticipant {
  return { id: user?.id ?? '', type: 'user', name: user?.name ?? '', email: user?.email ?? '' };
}

/**
 * Helper function to check if form data has changed from original event
 */
function checkIsDirty(
  event: Event | undefined,
  title: string,
  description: string,
  participants: EventParticipant[],
  icon: string | undefined,
  open: boolean,
  userId?: string,
): boolean {
  if (!open) return false;

  if (!event) {
    // If creating a new event, check if title or any participant name is dirty
    // Treat the default icon ("flight") as not a user change
    const iconDirty = Boolean(icon && icon !== DEFAULT_ICON);

    // If the only participant is the default user (pre-filled), don't treat it as a change.
    // New participant shape: { type: 'user'|'guest'|'pot', id, name? }
    const hasNonDefaultParticipant = participants.some((p) => {
      if (p.type === 'guest') {
        const name = (p.name || '').trim();
        return Boolean(name);
      }
      if (p.type === 'pot') {
        return true;
      }
      if (p.type === 'user') {
        // If single prefilled user equals current user, ignore
        if (participants.length === 1 && userId && p.id === userId) {
          return false;
        }
        // Any additional user (other than current) counts as change
        return true;
      }
      return false;
    });

    return Boolean(title.trim() || description.trim() || hasNonDefaultParticipant || iconDirty);
  }

  // Check if title has changed
  if (title.trim() !== event.title.trim()) return true;

  // Check if the number of participants has changed
  if (participants.length !== event.participants.length) return true;

  // Compare by id and name, regardless of order
  for (const current of participants) {
    const original = event.participants.find((p) => p.type === current.type && p.id === current.id);
    if (!original) return true;

    // For guest participants we must compare names as well
    if (current.type === 'guest') {
      const curName = (current.name || '').trim();
      const origName = (original.type === 'guest' ? original.name || '' : '').trim();
      if (curName !== origName) return true;
    }
  }

  return false;
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
  const createEvent = useCreateEvent();
  const { t } = useTranslation();

  // Centralized reset function to avoid duplication
  const resetForm = useCallback(() => {
    setTitle(event ? event.title : '');
    setDescription(event && event.description ? event.description : '');
    setParticipants(event ? event.participants : [buildDefaultParticipant(user)]);
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

  // Memoize form validation
  const canSubmit = useMemo(() => !!title.trim() && cleanParticipants.length > 0, [title, cleanParticipants]);

  // Check if form has unsaved changes
  const isDirty = useMemo(
    () => checkIsDirty(event, title, description, participants, icon, open, user?.id),
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
            const message = error instanceof Error ? error.message : t('common.errorLoading');
            modal.setErrorMessage(message);
          },
        });
      }
    },
    [canSubmit, title, description, event?.id, cleanParticipants, icon, onSubmit, modal, createEvent, t],
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
