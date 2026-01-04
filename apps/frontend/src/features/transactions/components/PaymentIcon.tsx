import type { PaymentType } from '../types';
import { PAYMENT_TYPE_CONFIG } from '../constants';

interface PaymentIconProps {
  type: PaymentType;
}

/**
 * Helper component to render the appropriate icon for a payment type
 * Uses centralized configuration from constants
 */
export default function PaymentIcon({ type }: PaymentIconProps) {
  const config = PAYMENT_TYPE_CONFIG[type];

  // Fallback if type is invalid
  if (!config) {
    console.warn(`Invalid payment type: ${type}`);
    return null;
  }

  const IconComponent = config.IconComponent;
  return <IconComponent className={config.colorStrong} />;
}
