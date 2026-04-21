export const PaymentType = {
  CONTRIBUTION: 'contribution',
  EXPENSE: 'expense',
  COMPENSATION: 'compensation',
} as const;

export type PaymentType = (typeof PaymentType)[keyof typeof PaymentType];
