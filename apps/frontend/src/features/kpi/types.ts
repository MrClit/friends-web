/**
 * KPI specification - single source of truth
 * All valid KPI types are derived from this object
 */
export const KPI_SPEC = {
  balance: {},
  contributions: {},
  expenses: {},
  pending: {},
} as const;

/**
 * Available KPI types - derived from KPI_SPEC
 */
export type KPIType = keyof typeof KPI_SPEC;

/**
 * Item data for participant or pot display
 */
export interface KPIParticipantItem {
  id: string; // Unique ID (participantId or POT_PARTICIPANT_ID)
  name: string; // Display name
  value: string; // Formatted amount (formatAmount already applied)
  isPot?: boolean; // Indicates if this is the Pot
  avatar?: string; // Avatar URL or initials
  percentage?: number; // Progress bar percentage (0-100)
  bgColor?: string; // Background color for avatar (when no image)
  textColor?: string; // Text color for avatar initials
}

/**
 * Configuration for each KPI type
 */
export interface KPIConfig {
  label: string;
  colorClass: string;
  borderColorClass: string;
  descriptionKey: string;
  IconComponent: React.ComponentType<{ className?: string }>;
  includePot: boolean; // Whether to show Pot in the list
  gradients: readonly string[]; // Gradient classes for progress bar (3 variants for cycling through participants)
}
