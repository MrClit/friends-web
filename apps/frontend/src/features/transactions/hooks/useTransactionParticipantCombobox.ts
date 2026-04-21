import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';

export interface TransactionParticipantOption {
  id: string;
  label: string;
  description?: string | null;
  avatar?: string | null;
  isPot?: boolean;
}

interface UseTransactionParticipantComboboxProps {
  value: string;
  options: TransactionParticipantOption[];
  onChange: (participantId: string) => void;
}

export function useTransactionParticipantCombobox({
  value,
  options,
  onChange,
}: UseTransactionParticipantComboboxProps) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [searchValue, setSearchValue] = useState('');

  const selectedOption = useMemo(() => options.find((option) => option.id === value), [options, value]);

  const filteredOptions = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) {
      return options;
    }

    return options.filter((option) => {
      const label = option.label.toLowerCase();
      const description = option.description?.toLowerCase() ?? '';
      return label.includes(query) || description.includes(query);
    });
  }, [searchValue, options]);

  const optionsCount = filteredOptions.length;

  const close = useCallback(() => {
    setOpen(false);
    setHighlightedIndex(-1);
    setSearchValue('');
  }, []);

  const openPopover = useCallback(() => {
    setOpen(true);
    setHighlightedIndex(-1);
    setSearchValue('');
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        openPopover();
        return;
      }

      close();
    },
    [openPopover, close],
  );

  const handleSelectOption = useCallback(
    (option: TransactionParticipantOption) => {
      onChange(option.id);
      close();
    },
    [onChange, close],
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
    setHighlightedIndex(-1);
  }, []);

  const handleTriggerKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (open) return;

      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openPopover();

        if (optionsCount > 0) {
          setHighlightedIndex(0);
        }
      }
    },
    [open, openPopover, optionsCount],
  );

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const scrollIntoView = (index: number) => {
        listRef.current?.querySelectorAll<HTMLButtonElement>('button')[index]?.scrollIntoView({ block: 'nearest' });
      };

      if (e.key === 'ArrowDown') {
        e.preventDefault();

        if (optionsCount === 0) return;

        setHighlightedIndex((prev) => {
          const next = prev < optionsCount - 1 ? prev + 1 : 0;
          scrollIntoView(next);
          return next;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();

        if (optionsCount === 0) return;

        setHighlightedIndex((prev) => {
          const next = prev > 0 ? prev - 1 : optionsCount - 1;
          scrollIntoView(next);
          return next;
        });
      } else if (e.key === 'Enter') {
        e.preventDefault();

        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleSelectOption(filteredOptions[highlightedIndex]);
        } else if (filteredOptions.length === 1) {
          handleSelectOption(filteredOptions[0]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    },
    [optionsCount, highlightedIndex, filteredOptions, handleSelectOption, close],
  );

  useEffect(() => {
    if (highlightedIndex < filteredOptions.length) return;

    setHighlightedIndex(filteredOptions.length > 0 ? filteredOptions.length - 1 : -1);
  }, [highlightedIndex, filteredOptions]);

  return {
    open,
    handleOpenChange,
    listRef,
    searchValue,
    selectedOption,
    filteredOptions,
    highlightedIndex,
    setHighlightedIndex,
    handleSearchChange,
    handleTriggerKeyDown,
    handleSearchKeyDown,
    handleSelectOption,
  };
}
