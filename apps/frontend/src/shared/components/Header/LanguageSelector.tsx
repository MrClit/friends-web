import { MdLanguage, MdCheck } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui';
import { LANGUAGES } from '@/i18n/constants';

/**
 * Language selector dropdown with i18n support.
 * Shows language names in dropdown and checkmark for active language.
 */
export default function LanguageSelector() {
  const { i18n, t } = useTranslation();
  const current = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  const handleSelect = (code: string) => {
    i18n.changeLanguage(code);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={t('language.select', 'Seleccionar idioma')}
          title={t('language.current', { lng: current.name })}
          className="flex items-center p-2 gap-2 rounded-full border-2 border-teal-400 dark:border-teal-700 bg-transparent hover:bg-teal-100 dark:hover:bg-teal-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
        >
          <MdLanguage className="text-teal-600 dark:text-yellow-300 text-xl" />
          <span className="font-bold text-teal-700 dark:text-yellow-200 text-xs drop-shadow">{current.label}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-32 rounded-lg border border-teal-200 dark:border-teal-800 bg-white dark:bg-teal-900"
      >
        {LANGUAGES.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => handleSelect(l.code)}
            className={`text-sm font-semibold cursor-pointer flex items-center justify-between gap-2 rounded-md ${
              i18n.language === l.code
                ? 'bg-teal-100 dark:bg-teal-800 text-teal-900 dark:text-teal-100'
                : 'text-teal-700 dark:text-teal-200'
            }`}
          >
            <span>
              {l.name} <span className="text-xs opacity-70">({l.label})</span>
            </span>
            {i18n.language === l.code && <MdCheck className="text-teal-600 dark:text-teal-300" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
