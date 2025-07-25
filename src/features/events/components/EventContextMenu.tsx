import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslation } from 'react-i18next';

interface EventContextMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function EventContextMenu({ anchorEl, open, onClose, onEdit, onDelete }: EventContextMenuProps) {
  const { t } = useTranslation();
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      slotProps={{
        paper: {
          sx: {
            backgroundColor: 'white',
            color: '#134e4a',
            boxShadow: 8,
            border: 0,
          },
        },
      }}
    >
      <MenuItem onClick={() => { onClose(); if (onEdit) { onEdit(); } }} className="hover:bg-teal-100 dark:hover:bg-teal-800">
        <EditIcon fontSize="small" className="mr-2 text-teal-900" />
        {t('eventContextMenu.edit')}
      </MenuItem>
      <MenuItem onClick={() => { onClose(); if (onDelete) { onDelete(); } }} className="hover:bg-red-100 dark:hover:bg-red-900">
        <DeleteIcon fontSize="small" className="mr-2 text-red-700" />
        {t('eventContextMenu.delete')}
      </MenuItem>
    </Menu>
  );
}
