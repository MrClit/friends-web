import type { EventParticipant, ParticipantReplacement } from '../types';
import { ParticipantsList } from './ParticipantsList';
import { IconPicker } from './IconPicker';
import { EventGroupField } from './EventGroupField';
import type { Group } from '@/api/groups.api';
import { useTranslation } from 'react-i18next';

export interface EventFormState {
  title: string;
  setTitle: (title: string) => void;
  description: string;
  setDescription: (description: string) => void;
  participants: EventParticipant[];
  setParticipants: (newParticipants: EventParticipant[] | ((prev: EventParticipant[]) => EventParticipant[])) => void;
  setParticipantReplacements: (
    replacements: ParticipantReplacement[] | ((prev: ParticipantReplacement[]) => ParticipantReplacement[]),
  ) => void;
  icon?: string;
  setIcon?: (key: string) => void;
  groups: Group[];
  groupId: string;
  groupName?: string;
  canChangeGroup: boolean;
  onGroupChange: (groupId: string) => void;
  removedByGroupChange: string[];
}

interface EventFormProps {
  fields: EventFormState;
  onSubmit: (e: React.FormEvent) => void;
}

export function EventForm({ fields, onSubmit }: EventFormProps) {
  const { t } = useTranslation('events');
  const {
    title,
    setTitle,
    description,
    setDescription,
    participants,
    setParticipants,
    setParticipantReplacements,
    icon,
    setIcon,
    groups,
    groupId,
    groupName,
    canChangeGroup,
    onGroupChange,
    removedByGroupChange,
  } = fields;

  return (
    <form id="event-form" className="space-y-6" onSubmit={onSubmit}>
      {setIcon && <IconPicker selected={icon} onSelect={setIcon} />}
      <div>
        <label htmlFor="event-title" className="block text-slate-700 dark:text-emerald-100 font-medium mb-2">
          {t('eventForm.titleLabel')}
        </label>
        <input
          id="event-title"
          type="text"
          className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 dark:border-emerald-800 bg-slate-50 dark:bg-emerald-900/30 focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none transition-all dark:text-white placeholder:text-slate-400 dark:placeholder:text-emerald-700 font-medium"
          placeholder={t('eventForm.titlePlaceholder')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
        />
      </div>
      <div>
        <label htmlFor="event-description" className="block text-slate-700 dark:text-emerald-100 font-medium mb-2">
          {t('eventForm.descriptionLabel')}
        </label>
        <textarea
          id="event-description"
          className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 dark:border-emerald-800 bg-slate-50 dark:bg-emerald-900/30 focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none transition-all dark:text-white placeholder:text-slate-400 dark:placeholder:text-emerald-700 resize-none font-medium"
          placeholder={t('eventForm.descriptionPlaceholder')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>
      <EventGroupField
        groups={groups}
        groupId={groupId}
        groupName={groupName}
        canChange={canChangeGroup}
        onChange={onGroupChange}
        removedNames={removedByGroupChange}
      />
      <ParticipantsList
        groupId={groupId}
        participants={participants}
        setParticipants={setParticipants}
        setParticipantReplacements={setParticipantReplacements}
      />
      {/* Submit button moved to modal footer via <button form="event-form" type="submit"> to match design */}
    </form>
  );
}
