import { useEffect, useState } from "react";
import { useEventsStore } from "../store/useEventsStore";
import ConfirmDialog from "../../../shared/components/ConfirmDialog";
import EventForm from "./EventForm";
import type { Event, EventParticipant } from '../types';

interface EventFormModalProps {
  open: boolean;
  onClose: () => void;
  event?: Event; // Si se pasa, es edición
  onSubmit?: (event: { id?: string; title: string; participants: EventParticipant[] }) => void;
}

export default function EventFormModal({
  open,
  onClose,
  event,
  onSubmit,
}: EventFormModalProps) {
  const [title, setTitle] = useState('');
  const [participants, setParticipants] = useState<EventParticipant[]>([{ id: crypto.randomUUID(), name: '' }]);
  const [showConfirm, setShowConfirm] = useState(false);
  const addEvent = useEventsStore((state) => state.addEvent);

  useEffect(() => {
    if (open) {
      setTitle(event ? event.title : '');
      setParticipants(event ? event.participants : [{ id: crypto.randomUUID(), name: '' }]);
    }
  }, [open, event]);

  let isDirty = false;
  if (open) {
    if (!event) {
      // If creating a new event, check if title or any participant name is dirty
      isDirty = Boolean(title.trim() || participants.some(p => p.name.trim()));
    } else {
      const originalTitle = event.title;
      const originalParticipants = event.participants;
      // Check if title have changed
      if (title.trim() !== originalTitle.trim()) isDirty = true;
      // Check if the number of participants have changed
      else if (participants.length !== originalParticipants.length) isDirty = true;
      else {
        // Compare by id and name, regardless of order
        for (const current of participants) {
          const original = originalParticipants.find(p => p.id === current.id);
          if (
            !original ||
            typeof current.name !== 'string' ||
            typeof original.name !== 'string' ||
            current.name.trim() !== original.name.trim()
          ) {
            isDirty = true;
            break;
          }
        }
      }
    }
  }

  if (!open) return null;

  const handleClose = () => {
    if (isDirty) {
      setShowConfirm(true);
    } else {
      // reset form state
      setTitle(event ? event.title : '');
      setParticipants(event ? event.participants : [{ id: crypto.randomUUID(), name: '' }]);
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setShowConfirm(false);
    setTitle(event ? event.title : '');
    setParticipants(event ? event.participants : [{ id: crypto.randomUUID(), name: '' }]);
    onClose();
  };

  const handleCancelClose = () => {
    setShowConfirm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanParticipants = participants.map(p => ({ ...p, name: p.name.trim() })).filter(p => p.name);
    if (!title.trim() || cleanParticipants.length === 0) return;
    if (onSubmit) {
      onSubmit({ id: event?.id, title: title.trim(), participants: cleanParticipants });
    } else {
      addEvent(title.trim(), cleanParticipants);
    }
    setTitle(event ? event.title : '');
    setParticipants(event ? event.participants : [{ id: crypto.randomUUID(), name: '' }]);
    onClose();
  };

  const canSubmit = !!title.trim() && participants.some(p => typeof p.name === 'string' && !!p.name.trim());

  return (
    <>
      <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/30" onClick={handleClose}>
        <div
          className="w-full max-w-md bg-white dark:bg-teal-900 rounded-t-3xl p-6 shadow-lg animate-slideUp
            min-h-[50vh] max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-teal-700 dark:text-teal-100">
              {event ? 'Editar Evento' : 'Nuevo Evento'}
            </h2>
            <button onClick={handleClose} className="text-2xl text-teal-400 hover:text-teal-600">&times;</button>
          </div>
          <EventForm
            title={title}
            setTitle={setTitle}
            participants={participants}
            setParticipants={setParticipants}
            onSubmit={handleSubmit}
            canSubmit={canSubmit}
            mode={event ? 'edit' : 'create'}
          />
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
      <ConfirmDialog
        open={showConfirm}
        title={event ? '¿Descartar cambios?' : '¿Descartar nuevo evento?'}
        message={event ? 'Tienes cambios sin guardar. ¿Seguro que quieres cerrar el formulario?' : '¿Seguro que quieres cerrar el formulario?'}
        confirmText="Descartar"
        cancelText="Cancelar"
        onConfirm={handleConfirmClose}
        onCancel={handleCancelClose}
      />
    </>
  );
}
