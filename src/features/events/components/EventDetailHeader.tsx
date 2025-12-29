import { MdArrowBack } from 'react-icons/md';
import EventContextMenu from './EventContextMenu';

interface EventDetailHeaderProps {
  eventId: string;
  eventTitle: string;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function EventDetailHeader({
  eventTitle,
  onBack,
  onEdit,
  onDelete,
}: EventDetailHeaderProps) {
  return (
    <div className="flex items-center justify-between w-full max-w-2xl mt-8 mb-4 gap-2">
      <button
        type="button"
        onClick={onBack}
        className="p-2 rounded-lg hover:bg-teal-200 dark:hover:bg-teal-800 transition-colors"
        aria-label="Volver"
      >
        <MdArrowBack className="text-teal-900 dark:text-teal-100 text-2xl" />
      </button>
      <h1 className="text-2xl md:text-3xl font-bold text-center flex-1 truncate text-teal-900 dark:text-teal-100">
        {eventTitle}
      </h1>
      <EventContextMenu
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}
