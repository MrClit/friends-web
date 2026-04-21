/**
 * KPI specification - single source of truth
 * All valid KPI types are derived from this object
 */
export const KPI_SPEC = {
  balance: {},
  contributionStatus: {},
  userStatus: {},
  expenses: {},
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
  rawAmount?: number; // Raw numeric value for calculations (e.g., percentage with negative values)
  targetValue?: string; // Optional formatted contribution target context
  isPot?: boolean; // Indicates if this is the Pot
  avatar?: string | null; // Avatar URL or initials
  percentage?: number; // Progress bar percentage (0-100, uses absolute magnitude for negatives)
  bgColor?: string; // Background color for avatar (when no image)
  textColor?: string; // Text color for avatar initials
}

export interface KPIBalanceParticipantAmountItem {
  id: string;
  name: string;
  amount: number;
}

export interface KPIBalancePotExpenseItem {
  id: string;
  title: string;
  amount: number;
  date: string;
}

export interface KPIBalanceBreakdownViewModel {
  inflowsTotal: number;
  compensationsTotal: number;
  potExpensesTotal: number;
  outflowsTotal: number;
  potBalance: number;
  isConsistent: boolean;
  inflowItems: KPIBalanceParticipantAmountItem[];
  compensationItems: KPIBalanceParticipantAmountItem[];
  potExpenseItems: KPIBalancePotExpenseItem[];
}

export interface KPIContributionStatusSummaryData {
  compliancePercent?: number;
  netTotal: number;
  targetTotal: number;
  differenceTotal: number;
  adjustmentPending: number;
}

export interface KPISelectableParticipant {
  id: string;
  name: string;
  avatar?: string | null;
}

export interface KPIUserStatusSummaryData {
  participantId: string;
  participantName: string;
  compliancePercent?: number;
  netTotal: number;
  targetTotal: number;
  differenceTotal: number;
  adjustmentPending: number;
  isCurrentUser: boolean;
}

export type KPIValueFormat = 'amount' | 'percent';

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
  valueFormat?: KPIValueFormat;
}
