import ParticipantsInput from "./ParticipantsInput";
import { useState } from "react";
import { useEventsStore } from "../store/useEventsStore";

interface NewEventModalProps {
  open: boolean;
  onClose: () => void;
}

export default function NewEventModal({ open, onClose }: NewEventModalProps) {
  const [participants, setParticipants] = useState<string[]>([""]);
  const [title, setTitle] = useState("");
  const addEvent = useEventsStore((state) => state.addEvent);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanParticipants = participants.map(p => p.trim()).filter(Boolean);
    if (!title.trim() || cleanParticipants.length === 0) return;
    addEvent(title.trim(), cleanParticipants.map(name => ({ name })));
    setTitle("");
    setParticipants([""]);
    onClose();
  };

  const canSubmit = title.trim() && participants.some(p => p.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white dark:bg-teal-900 rounded-t-3xl p-6 shadow-lg animate-slideUp"
        style={{ minHeight: '50vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-teal-700 dark:text-teal-100">Nuevo Evento</h2>
          {/* TODO: Limpiar el formulario antes de cerrar el modal*/}
          <button onClick={onClose} className="text-2xl text-teal-400 hover:text-teal-600">&times;</button>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
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
            Crear Evento
          </button>
        </form>
      </div>
      <style>{`
        .animate-slideUp {
          animation: slideUp .3s cubic-bezier(.4,0,.2,1);
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
