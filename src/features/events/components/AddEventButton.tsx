interface AddNewEventProps {
  onClick: () => void;
}

export default function AddEventButton({ onClick }: AddNewEventProps) {
  return (
    <button
      type="button"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-6 py-3 rounded-full bg-teal-500 hover:bg-teal-600 text-white font-bold shadow-lg text-lg transition-all focus:outline-none focus:ring-2 focus:ring-teal-300 z-50"
      onClick={onClick}
    >
      <span className="text-2xl leading-none">+</span>
      Nuevo Evento
    </button>
  );
}