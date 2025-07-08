import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

interface EventContextMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function EventContextMenu({ anchorEl, open, onClose, onEdit, onDelete }: EventContextMenuProps) {
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <MenuItem onClick={() => { onClose(); onEdit && onEdit(); }}>
        <EditIcon fontSize="small" className="mr-2" />
        Modificar
      </MenuItem>
      <MenuItem onClick={() => { onClose(); onDelete && onDelete(); }}>
        <DeleteIcon fontSize="small" className="mr-2" />
        Borrar
      </MenuItem>
    </Menu>
  );
}
