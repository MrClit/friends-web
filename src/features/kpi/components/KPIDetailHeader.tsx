import { useNavigate } from 'react-router-dom';
import { MdArrowBack } from 'react-icons/md';

interface KPIDetailHeaderProps {
  eventId: string;
  eventTitle: string;
}

/**
 * Header component for KPI detail pages
 * Shows navigation back button and event title
 */
export default function KPIDetailHeader({ eventId, eventTitle }: KPIDetailHeaderProps) {
  const navigate = useNavigate();
  
  return (
    <div className="flex items-center justify-between w-full max-w-2xl mt-8 mb-4 gap-2">
      <button 
        onClick={() => navigate(`/event/${eventId}`)}
        className="p-2 rounded-lg hover:bg-teal-200 dark:hover:bg-teal-800"
        aria-label="Volver"
      >
        <MdArrowBack />
      </button>
      <h1 className="text-2xl md:text-3xl font-bold text-center flex-1 truncate text-teal-900 dark:text-teal-100">
        {eventTitle}
      </h1>
      <div className="w-10" /> {/* Spacer for centering */}
    </div>
  );
}
