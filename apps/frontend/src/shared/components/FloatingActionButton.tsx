import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface FloatingActionButtonProps {
  onClick: () => void;
  translationKey: string;
  icon?: ReactNode;
  className?: string;
}

/**
 * Floating action button with internal i18n support.
 * @param translationKey - i18next key for button label
 */
export default function FloatingActionButton({ onClick, translationKey, icon, className }: FloatingActionButtonProps) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      className={`fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 sm:px-6 py-3 rounded-full bg-teal-500 hover:bg-teal-600 text-white font-bold shadow-lg text-base sm:text-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 z-10 whitespace-nowrap cursor-pointer ${className || ''}`}
      onClick={onClick}
    >
      {icon && <span className="text-2xl leading-none">{icon}</span>}
      {t(translationKey)}
    </button>
  );
}
