import { MdEvent, MdPerson } from 'react-icons/md';
import { cn } from '@/shared/utils/cn';
import type { FC } from 'react';

export interface EventCardParticipant {
  avatarUrl?: string;
  name?: string;
}

export interface EventCardProps {
  event: {
    id: string;
    title: string;
    description?: string;
    status?: 'active' | 'archived';
    participants?: EventCardParticipant[];
    lastModified?: string | null;
    icon?: React.ReactNode;
  };
  onClick?: (id: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

const statusConfig = {
  active: {
    label: 'Activo',
    className: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 border-emerald-200/50',
  },
  archived: {
    label: 'Archivado',
    className: 'bg-slate-100 dark:bg-emerald-900/30 text-slate-500 dark:text-emerald-400 border-slate-200/50',
  },
};

export const EventCard: FC<EventCardProps> = ({ event, onClick, className, style }) => {
  const {
    id,
    title,
    description = 'Sin descripción',
    status = 'active',
    participants = [],
    lastModified,
    icon,
  } = event;

  const statusInfo = statusConfig[status] || statusConfig.active;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Abrir evento ${title}`}
      className={cn(
        'group event-card p-7 rounded-3xl cursor-pointer flex flex-col outline-none focus:ring-2 focus:ring-emerald-600',
        'bg-white dark:bg-emerald-950/60 border-slate-100 dark:border-emerald-800/50 shadow-sm transition-all duration-300',
        'hover:shadow-xl hover:shadow-emerald-900/10 hover:border-emerald-200/50 hover:-translate-y-1',
        className,
      )}
      style={style}
      onClick={() => onClick?.(id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick?.(id);
      }}
    >
      <div className="flex justify-between items-start mb-6">
        <div
          className={cn(
            'w-14 h-14 bg-emerald-50 dark:bg-emerald-900/40 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-700 group-hover:text-white transition-colors duration-300',
            // status === 'archived' && 'text-emerald-600',
          )}
        >
          {icon || <MdEvent size={32} />}
        </div>
        <span
          className={cn(
            'px-3 py-1 text-[11px] font-bold rounded-lg uppercase tracking-wider border',
            statusInfo.className,
          )}
        >
          {statusInfo.label}
        </span>
      </div>
      <h3 className="text-2xl font-bold mb-2 group-hover:text-emerald-600 transition-colors text-slate-900 dark:text-white">
        {title}
      </h3>
      <p className="text-slate-500 dark:text-emerald-200/60 text-sm mb-8 leading-relaxed">{description}</p>
      <div className="mt-auto flex items-center justify-between pt-6 border-t border-emerald-50 dark:border-emerald-800/50">
        <div className="flex -space-x-3">
          {participants.slice(0, 3).map((p, i) =>
            p.avatarUrl ? (
              <img
                key={i}
                alt={p.name || 'Participante'}
                className="w-10 h-10 rounded-full border-4 border-white dark:border-emerald-950 object-cover"
                src={p.avatarUrl}
              />
            ) : (
              <div
                key={i}
                className="w-10 h-10 rounded-full border-4 border-white dark:border-emerald-950 bg-emerald-50 dark:bg-emerald-900 flex items-center justify-center text-xs font-bold text-emerald-600 dark:text-emerald-300"
              >
                <MdPerson size={20} />
              </div>
            ),
          )}
          {participants.length > 3 && (
            <div className="w-10 h-10 rounded-full border-4 border-white dark:border-emerald-950 bg-emerald-50 dark:bg-emerald-900 flex items-center justify-center text-xs font-bold text-emerald-600 dark:text-emerald-300">
              +{participants.length - 3}
            </div>
          )}
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-emerald-600/50 dark:text-emerald-400/50 uppercase tracking-widest">
            {status === 'archived' ? 'Fecha' : 'Último cambio'}
          </p>
          {lastModified && <p className="text-sm font-semibold text-slate-600 dark:text-emerald-200">{lastModified}</p>}
        </div>
      </div>
    </div>
  );
};
