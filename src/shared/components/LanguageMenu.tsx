import React from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import LanguageIcon from '@mui/icons-material/Language';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
  { code: 'ca', label: 'CA' },
];

export default function LanguageMenu() {
  const { i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const current = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleSelect = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('i18nextLng', code);
    handleClose();
  };

  return (
    <>
      <IconButton
        aria-label="Seleccionar idioma"
        onClick={handleClick}
        className="bg-white/90 dark:bg-teal-950/90 border-2 border-teal-500 dark:border-yellow-400 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-400 px-2 h-10 w-16 flex justify-center items-center backdrop-blur-md hover:bg-teal-100 dark:hover:bg-teal-800 transition-colors"
        size="small"
        sx={{ borderRadius: 8, width: 64, height: 40, padding: 0 }}
      >
        <LanguageIcon className="text-teal-600 dark:text-yellow-300" />
        <span className="ml-1 font-bold text-teal-700 dark:text-yellow-200 text-xs drop-shadow">{current.label}</span>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            className: 'bg-white dark:bg-teal-900 shadow-lg',
            style: { minWidth: 80 }
          }
        }}
      >
        {LANGUAGES.map(l => (
          <MenuItem
            key={l.code}
            selected={i18n.language === l.code}
            onClick={() => handleSelect(l.code)}
            className="text-teal-700 dark:text-yellow-200 text-sm font-semibold"
          >
            {l.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
