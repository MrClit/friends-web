interface ParticipantsInputProps {
    participants: string[];
    setParticipants: (newParticipants: string[] | ((prev: string[]) => string[])) => void;
}

export default function ParticipantsInput({participants, setParticipants}: ParticipantsInputProps) {
    return (
        <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-teal-700 dark:text-teal-100 font-medium">Participantes</label>
              <button
                type="button"
                aria-label="Añadir participante"
                className={`ml-2 p-1 rounded-full bg-teal-100 dark:bg-teal-800 hover:bg-teal-200 dark:hover:bg-teal-700 text-teal-600 dark:text-teal-200 transition disabled:opacity-50`}
                onClick={() => setParticipants((p: string[]) => [...p, ""])}
                disabled={participants[participants.length-1].trim() === ""}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            <div className="space-y-2">
              {participants.map((name, idx) => (
                <input
                  key={idx}
                  type="text"
                  className="w-full px-4 py-2 rounded-lg border border-teal-200 dark:border-teal-700 bg-teal-50 dark:bg-teal-800 text-teal-900 dark:text-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  placeholder={`Participante ${idx + 1}`}
                  value={name}
                  onChange={e => {
                    const newList = [...participants];
                    newList[idx] = e.target.value;
                    setParticipants(newList);
                  }}
                />
              ))}
            </div>
        </div>
    );
}