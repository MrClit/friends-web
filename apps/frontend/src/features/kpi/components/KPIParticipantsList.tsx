import type { KPIParticipantItem, KPIConfig } from '../types';
import { KPIParticipantItem as KPIParticipantItemRow } from './KPIParticipantItem';

interface KPIParticipantsListProps {
  items: KPIParticipantItem[];
  title: string; // Translated title (e.g., "Participants")
  kpiConfig: KPIConfig; // KPI configuration with gradients
}

/**
 * List component for displaying participants and optionally the Pot
 * Shows participant names, avatars, progress bars, and their KPI values
 * Pot items are visually differentiated with orange styling
 * Gradient colors are aligned with the KPI type (balance=green, contributions=blue, expenses=red, pending=yellow)
 */
export function KPIParticipantsList({ items, title, kpiConfig }: KPIParticipantsListProps) {
  const participantCount = items.length;

  const getGradientClass = (index: number) => {
    return kpiConfig.gradients[index % kpiConfig.gradients.length];
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h3>
        {participantCount && (
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            {participantCount} Participantes
          </span>
        )}
      </div>
      <div className="space-y-3">
        {items.map((item, index) => {
          const gradientClass = getGradientClass(index);
          return <KPIParticipantItemRow key={item.id} item={item} gradientClass={gradientClass} />;
        })}
      </div>
    </div>
  );
}
