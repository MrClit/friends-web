import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreateEvent } from '../../../hooks/api/useEvents';
import type { Event, EventParticipant } from '../types';
import { useAuth } from '@/features/auth/useAuth';

/**
 * Helper function to check if form data has changed from original event
 */
function checkIsDirty(
  event: Event | undefined,
  title: string,
  participants: EventParticipant[],
  icon: string | undefined,
  open: boolean,
): boolean {
  if (!open) return false;

  if (!event) {
    // If creating a new event, check if title or any participant name is dirty
    return Boolean(title.trim() || participants.some((p) => p.name.trim()) || Boolean(icon));
  }

  // Check if title has changed
  if (title.trim() !== event.title.trim()) return true;

  // Check if the number of participants has changed
  if (participants.length !== event.participants.length) return true;

  // Compare by id and name, regardless of order
  for (const current of participants) {
    const original = event.participants.find((p) => p.id === current.id);
    if (
      !original ||
      typeof current.name !== 'string' ||
      typeof original.name !== 'string' ||
      current.name.trim() !== original.name.trim()
    ) {
      return true;
    }
  }
  // Compare icon
  // if ((icon ?? '') !== (event.icon ?? '')) return true;

  return false;
}

interface UseEventFormModalProps {
  open: boolean;
  event?: Event;
  onClose: () => void;
  onSubmit?: (event: { id?: string; title: string; participants: EventParticipant[] }) => void;
}

export function useEventFormModal({ open, event, onClose, onSubmit }: UseEventFormModalProps) {
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [participants, setParticipants] = useState<EventParticipant[]>([
    { id: user?.id ?? '', name: user?.name ?? '' },
  ]);
  const [icon, setIcon] = useState<string>(event?.icon ?? 'flight');
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const createEvent = useCreateEvent();
  const { t } = useTranslation();

  // Centralized reset function to avoid duplication
  const resetForm = useCallback(() => {
    setTitle(event ? event.title : '');
    setParticipants(event ? event.participants : [{ id: user?.id ?? '', name: user?.name ?? '' }]);
    setIcon(event ? (event.icon ?? 'flight') : 'flight');
    setErrorMessage(null);
  }, [event, user?.id, user?.name]);

  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open, resetForm]);

  // Memoize clean participants (trim and filter empty)
  const cleanParticipants = useMemo(
    () => participants.map((p) => ({ ...p, name: p.name.trim() })).filter((p) => p.name),
    [participants],
  );

  // Memoize form validation
  const canSubmit = useMemo(() => !!title.trim() && cleanParticipants.length > 0, [title, cleanParticipants]);

  // Check if form has unsaved changes
  const isDirty = useMemo(
    () => checkIsDirty(event, title, participants, icon, open),
    [event, title, participants, icon, open],
  );

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      // Don't allow closing if ConfirmDialog is already open
      if (!isOpen && !showConfirm) {
        if (isDirty) {
          setShowConfirm(true);
        } else {
          resetForm();
          onClose();
        }
      }
    },
    [isDirty, showConfirm, resetForm, onClose],
  );

  const handleConfirmClose = useCallback(() => {
    setShowConfirm(false);
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleCancelClose = useCallback(() => {
    setShowConfirm(false);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSubmit) return;

      setErrorMessage(null);
      const trimmedTitle = title.trim();
      const eventData = { id: event?.id, title: trimmedTitle, participants: cleanParticipants, icon };

      if (onSubmit) {
        // Custom submit handler (used for edit mode)
        onSubmit(eventData);
        // Ensure any pending "confirm" flag is cleared before closing
        setShowConfirm(false);
        resetForm();
        onClose();
      } else {
        // Create event via API
        createEvent.mutate(
          { title: trimmedTitle, participants: cleanParticipants },
          {
            onSuccess: () => {
              // Clear confirm state then close to avoid race with Radix onOpenChange
              setShowConfirm(false);
              resetForm();
              onClose();
            },
            onError: (error) => {
              const message = error instanceof Error ? error.message : t('common.errorLoading');
              setErrorMessage(message);
            },
          },
        );
      }
    },
    [canSubmit, title, event?.id, cleanParticipants, icon, onSubmit, resetForm, onClose, createEvent, t],
  );

  const isLoading = createEvent.isPending;

  return {
    // State
    title,
    setTitle,
    participants,
    setParticipants,
    icon,
    setIcon,
    showConfirm,
    errorMessage,
    // Computed
    isLoading,
    canSubmit,
    // Handlers
    handleOpenChange,
    handleConfirmClose,
    handleCancelClose,
    handleSubmit,
  };
}
