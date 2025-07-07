import { useState } from "react";
import { useEventsStore } from "../store/useEventsStore";
import ConfirmDialog from "../../../shared/components/ConfirmDialog";
import EventForm from "./EventForm";

interface NewEventModalProps {
  open: boolean;
  onClose: () => void;
}

export default function NewEventModal({ open, onClose }: NewEventModalProps) {
  const [participants, setParticipants] = useState<string[]>([""]);
  const [title, setTitle] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const addEvent = useEventsStore((state) => state.addEvent);

  if (!open) return null;

  const isDirty = title.trim() || participants.some(p => p.trim());

  const handleClose = () => {
    if (isDirty) {
      setShowConfirm(true);
    } else {
      setTitle("");
      setParticipants([""]);
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setShowConfirm(false);
    setTitle("");
    setParticipants([""]);
    onClose();
  };

  const handleCancelClose = () => {
    setShowConfirm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanParticipants = participants.map(p => p.trim()).filter(Boolean);
    if (!title.trim() || cleanParticipants.length === 0) return;
    addEvent(title.trim(), cleanParticipants.map(name => ({ name })));
    setTitle("");
    setParticipants([""]);
    onClose();
  };

  const canSubmit = !!title.trim() && participants.some(p => !!p.trim());

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30" onClick={handleClose}>
        <div
          className="w-full max-w-md bg-white dark:bg-teal-900 rounded-t-3xl p-6 shadow-lg animate-slideUp
            min-h-[50vh] max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-teal-700 dark:text-teal-100">Nuevo Evento</h2>
            <button onClick={handleClose} className="text-2xl text-teal-400 hover:text-teal-600">&times;</button>
          </div>
          <EventForm
            title={title}
            setTitle={setTitle}
            participants={participants}
            setParticipants={setParticipants}
            onSubmit={handleSubmit}
            canSubmit={canSubmit}
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
        title="¿Descartar cambios?"
        message="Tienes cambios sin guardar. ¿Seguro que quieres cerrar el formulario?"
        confirmText="Descartar"
        cancelText="Cancelar"
        onConfirm={handleConfirmClose}
        onCancel={handleCancelClose}
      />
    </>
  );
}
