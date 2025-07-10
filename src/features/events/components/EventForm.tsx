import ParticipantsInput from "./ParticipantsInput";

interface EventFormProps {
  title: string;
  setTitle: (title: string) => void;
  participants: string[];
  setParticipants: (newParticipants: string[] | ((prev: string[]) => string[])) => void;
  onSubmit: (e: React.FormEvent) => void;
  canSubmit: boolean;
  mode?: 'edit' | 'create';
}

export default function EventForm({
  title,
  setTitle,
  participants,
  setParticipants,
  onSubmit,
  canSubmit,
  mode,
}: EventFormProps) {
  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <div>
        <label className="block text-teal-700 dark:text-teal-100 font-medium mb-1">Título</label>
        <input
          type="text"
          className="w-full px-4 py-2 rounded-lg border border-teal-200 dark:border-teal-700 bg-teal-50 dark:bg-teal-800 text-teal-900 dark:text-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
          placeholder="Nombre del evento"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
      </div>
      <ParticipantsInput participants={participants} setParticipants={setParticipants} />
      <button
        type="submit"
        className="w-full py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-white font-bold text-lg transition"
        disabled={!canSubmit}
      >
        {mode === 'edit' ? 'Actualizar Evento' : 'Crear Evento'}
      </button>
    </form>
  );
}