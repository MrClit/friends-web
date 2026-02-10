import { FaHandHoldingUsd, FaWallet, FaHandshake, FaPiggyBank } from 'react-icons/fa';
import type { PaymentType } from './types';
import type { ComponentType } from 'react';

/**
 * Array of all payment types for iteration
 */
export const PAYMENT_TYPES: readonly PaymentType[] = ['contribution', 'expense', 'compensation'] as const;

/**
 * Color palette interface for consistent styling across components
 */
interface ColorPalette {
  bg: {
    light: string;
    dark: string;
  };
  text: {
    light: string;
    dark: string;
  };
  hover: {
    light: string;
    dark: string;
  };
  amount: {
    light: string;
    dark: string;
  };
}

/**
 * Color palettes for each payment type and pot
 * Used for consistent styling across components
 */
const COLOR_PALETTES: Record<string, ColorPalette> = {
  blue: {
    bg: { light: 'bg-blue-100', dark: 'dark:bg-blue-900/50' },
    text: { light: 'text-blue-600', dark: 'dark:text-blue-400' },
    hover: { light: 'hover:border-blue-200', dark: 'dark:hover:border-blue-900' },
    amount: { light: 'text-blue-600', dark: 'dark:text-blue-400' },
  },
  rose: {
    bg: { light: 'bg-rose-100', dark: 'dark:bg-rose-900/50' },
    text: { light: 'text-rose-600', dark: 'dark:text-rose-400' },
    hover: { light: 'hover:border-rose-200', dark: 'dark:hover:border-rose-900' },
    amount: { light: 'text-rose-600', dark: 'dark:text-rose-400' },
  },
  emerald: {
    bg: { light: 'bg-emerald-100', dark: 'dark:bg-emerald-900/50' },
    text: { light: 'text-emerald-600', dark: 'dark:text-emerald-400' },
    hover: { light: 'hover:border-emerald-200', dark: 'dark:hover:border-emerald-900' },
    amount: { light: 'text-emerald-600', dark: 'dark:text-emerald-400' },
  },
  amber: {
    bg: { light: 'bg-amber-100', dark: 'dark:bg-amber-900/50' },
    text: { light: 'text-amber-600', dark: 'dark:text-amber-400' },
    hover: { light: 'hover:border-amber-200', dark: 'dark:hover:border-amber-900' },
    amount: { light: 'text-amber-600', dark: 'dark:text-amber-400' },
  },
};

/**
 * Centralized configuration for payment types
 * Includes icon components and color palettes for consistent styling
 */
export const PAYMENT_TYPE_CONFIG: Record<
  PaymentType,
  {
    IconComponent: ComponentType<{ className?: string }>;
    colors: ColorPalette;
    colorLight: string; // Legacy: 700 shade - for colored backgrounds (buttons, chips)
    colorStrong: string; // Legacy: 800 shade - for white/transparent backgrounds
  }
> = {
  contribution: {
    IconComponent: FaHandHoldingUsd,
    colors: COLOR_PALETTES.blue,
    colorLight: 'text-blue-700 dark:text-blue-200',
    colorStrong: 'text-blue-800 dark:text-blue-200',
  },
  expense: {
    IconComponent: FaWallet,
    colors: COLOR_PALETTES.rose,
    colorLight: 'text-rose-700 dark:text-rose-200',
    colorStrong: 'text-rose-800 dark:text-rose-200',
  },
  compensation: {
    IconComponent: FaHandshake,
    colors: COLOR_PALETTES.emerald,
    colorLight: 'text-emerald-700 dark:text-emerald-200',
    colorStrong: 'text-emerald-800 dark:text-emerald-200',
  },
};

/**
 * Configuration for pot (bote) expenses
 * Used when a transaction is made by the common pot
 */
export const POT_CONFIG = {
  IconComponent: FaPiggyBank,
  colors: COLOR_PALETTES.amber,
  colorClass: 'text-amber-800 dark:text-amber-200',
} as const;
