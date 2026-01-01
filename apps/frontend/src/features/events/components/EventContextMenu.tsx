import { MdEdit, MdDelete, MdMoreVert } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface EventContextMenuProps {
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function EventContextMenu({ onEdit, onDelete }: EventContextMenuProps) {
  const { t } = useTranslation();
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="p-2 rounded-lg hover:bg-teal-200 dark:hover:bg-teal-800 transition-colors"
          aria-label="Opciones"
        >
          <MdMoreVert className="text-teal-900 dark:text-teal-100 text-2xl" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white dark:bg-teal-900">
        <DropdownMenuItem 
          onClick={() => { 
            if (onEdit) { onEdit(); } 
          }} 
          className="hover:bg-teal-100 dark:hover:bg-teal-800 cursor-pointer"
        >
          <MdEdit className="mr-2 text-teal-900 dark:text-teal-100" />
          {t('eventContextMenu.edit')}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => { 
            if (onDelete) { onDelete(); } 
          }} 
          className="hover:bg-red-100 dark:hover:bg-red-900 cursor-pointer"
        >
          <MdDelete className="mr-2 text-red-700 dark:text-red-400" />
          {t('eventContextMenu.delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
