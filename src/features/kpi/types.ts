/**
 * Available KPI types in the application
 */
export type KPIType = 'balance' | 'contributions' | 'expenses' | 'pending';

/**
 * Item data for participant or pot display
 */
export interface KPIParticipantItem {
  id: string;           // Unique ID (participantId or POT_PARTICIPANT_ID)
  name: string;         // Display name
  value: string;        // Formatted amount (formatAmount already applied)
  isPot?: boolean;      // Indicates if this is the Pot
}

/**
 * Configuration for each KPI type
 */
export interface KPIConfig {
  label: string;
  colorClass: string;
  includePot: boolean;  // Whether to show Pot in the list
}
