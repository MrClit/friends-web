import { MdLanguage } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const LANGUAGES = [
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
  { code: 'ca', label: 'CA' },
];

export default function LanguageMenu() {
  const { i18n } = useTranslation();
  const current = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  const handleSelect = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('i18nextLng', code);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Seleccionar idioma"
          className="bg-white/90 dark:bg-teal-950/90 border-2 border-teal-500 dark:border-yellow-400 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-400 px-2 h-10 w-16 flex justify-center items-center backdrop-blur-md hover:bg-teal-100 dark:hover:bg-teal-800 transition-colors"
        >
          <MdLanguage className="text-teal-600 dark:text-yellow-300 text-xl" />
          <span className="ml-1 font-bold text-teal-700 dark:text-yellow-200 text-xs drop-shadow">{current.label}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[80px]">
        {LANGUAGES.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => handleSelect(l.code)}
            className={`text-sm font-semibold cursor-pointer ${
              i18n.language === l.code
                ? 'bg-teal-100 dark:bg-teal-800 text-teal-900 dark:text-teal-100'
                : 'text-teal-700 dark:text-teal-200'
            }`}
          >
            {l.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
