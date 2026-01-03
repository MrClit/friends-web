import { FaHandHoldingUsd, FaWallet, FaHandshake, FaPiggyBank } from 'react-icons/fa';
import type { PaymentType } from './types';
import type { ComponentType } from 'react';

/**
 * Array of all payment types for iteration
 */
export const PAYMENT_TYPES: readonly PaymentType[] = ['contribution', 'expense', 'compensation'] as const;

/**
 * Centralized configuration for payment types
 * Includes icon components and color variants for different contexts
 */
export const PAYMENT_TYPE_CONFIG: Record<
  PaymentType,
  {
    IconComponent: ComponentType<{ className?: string }>;
    colorLight: string; // 700 shade - for colored backgrounds (buttons, chips)
    colorStrong: string; // 800 shade - for white/transparent backgrounds
  }
> = {
  contribution: {
    IconComponent: FaHandHoldingUsd,
    colorLight: 'text-blue-700 dark:text-blue-200',
    colorStrong: 'text-blue-800 dark:text-blue-200',
  },
  expense: {
    IconComponent: FaWallet,
    colorLight: 'text-red-700 dark:text-red-200',
    colorStrong: 'text-red-800 dark:text-red-200',
  },
  compensation: {
    IconComponent: FaHandshake,
    colorLight: 'text-green-700 dark:text-green-200',
    colorStrong: 'text-green-800 dark:text-green-200',
  },
};

/**
 * Configuration for pot (bote) expenses
 * Used when a transaction is made by the common pot
 */
export const POT_CONFIG = {
  IconComponent: FaPiggyBank,
  colorClass: 'text-orange-800 dark:text-orange-200',
} as const;
