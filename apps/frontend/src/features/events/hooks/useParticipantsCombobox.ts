import { useCallback, useMemo, useRef, useState } from 'react';
import type React from 'react';
import { useUsers } from '@/hooks/api/useUsers';
import type { User } from '@/features/auth/types';
import type { EventParticipant } from '../types';

interface UseParticipantsComboboxProps {
  existingParticipants: EventParticipant[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onSelect: (participant: EventParticipant) => void;
}

export function useParticipantsCombobox({
  existingParticipants,
  inputValue,
  onInputChange,
  onSelect,
}: UseParticipantsComboboxProps) {
  const { data: users = [], isLoading } = useUsers();
  const listRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Filter out already added participants
  const availableUsers = useMemo(() => {
    const existingIds = new Set(existingParticipants.filter((p) => p.type === 'user').map((p) => p.id));
    return users.filter((user) => !existingIds.has(user.id));
  }, [users, existingParticipants]);

  // LOCAL SEARCH: Filter users by input (no API call)
  const filteredUsers = useMemo(() => {
    if (!inputValue.trim()) return availableUsers;
    const query = inputValue.toLowerCase();
    return availableUsers.filter(
      (user) => user.name?.toLowerCase().includes(query) || user.email?.toLowerCase().includes(query),
    );
  }, [inputValue, availableUsers]);

  // Check if input matches no existing user (would create a new guest)
  const isNewUser = useMemo(
    () =>
      inputValue.trim().length > 0 && !filteredUsers.some((u) => u.name?.toLowerCase() === inputValue.toLowerCase()),
    [inputValue, filteredUsers],
  );

  const optionsCount = filteredUsers.length + (isNewUser ? 1 : 0);

  const close = useCallback(() => {
    setOpen(false);
    setHighlightedIndex(-1);
  }, []);

  const handleSelectUser = useCallback(
    (user: User) => {
      onSelect({ id: user.id, type: 'user', name: user.name || user.email, avatar: user.avatar });
      onInputChange('');
      close();
    },
    [onSelect, onInputChange, close],
  );

  const handleSelectNewGuest = useCallback(() => {
    if (!inputValue.trim()) return;
    onSelect({ id: crypto.randomUUID(), type: 'guest', name: inputValue.trim() });
    onInputChange('');
    close();
  }, [inputValue, onSelect, onInputChange, close]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!open) return;

      const scrollIntoView = (index: number) => {
        listRef.current?.querySelectorAll<HTMLButtonElement>('button')[index]?.scrollIntoView({ block: 'nearest' });
      };

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) => {
          const next = prev < optionsCount - 1 ? prev + 1 : 0;
          scrollIntoView(next);
          return next;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) => {
          const next = prev > 0 ? prev - 1 : optionsCount - 1;
          scrollIntoView(next);
          return next;
        });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredUsers.length) {
          handleSelectUser(filteredUsers[highlightedIndex]);
        } else if (highlightedIndex === filteredUsers.length && isNewUser) {
          handleSelectNewGuest();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    },
    [open, optionsCount, highlightedIndex, filteredUsers, isNewUser, handleSelectUser, handleSelectNewGuest, close],
  );

  const handleInputChange = useCallback(
    (value: string) => {
      onInputChange(value);
      setHighlightedIndex(-1);
      setOpen(true);
    },
    [onInputChange],
  );

  const handleInputFocus = useCallback(() => {
    if (inputValue.trim()) setOpen(true);
  }, [inputValue]);

  const handleInputBlur = useCallback(() => {
    setTimeout(() => {
      setOpen(false);
      setHighlightedIndex(-1);
    }, 150);
  }, []);

  return {
    open,
    setOpen,
    listRef,
    isLoading,
    filteredUsers,
    isNewUser,
    highlightedIndex,
    setHighlightedIndex,
    handleSelectUser,
    handleSelectNewGuest,
    handleKeyDown,
    handleInputChange,
    handleInputFocus,
    handleInputBlur,
  };
}
