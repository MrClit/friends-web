import { useRef, useEffect } from "react";
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

interface ParticipantsInputProps {
    participants: string[];
    setParticipants: (newParticipants: string[] | ((prev: string[]) => string[])) => void;
}

export default function ParticipantsInput({participants, setParticipants}: ParticipantsInputProps) {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (participants.length > 1) {
            inputRefs.current[participants.length - 1]?.focus();
        }
    }, [participants.length]);

    return (
        <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-teal-700 dark:text-teal-100 font-medium">Participantes</label>
              <button
                type="button"
                aria-label="Añadir participante"
                className={`ml-2 p-1 rounded-full hover:bg-teal-200 dark:hover:bg-teal-700 text-teal-600 dark:text-teal-200 transition disabled:opacity-50`}
                onClick={() => setParticipants((p: string[]) => [...p, ""])}
                disabled={participants[participants.length-1].trim() === ""}
              >
                <PersonAddIcon fontSize="medium" />
              </button>
            </div>
            <div className="space-y-4">
              {participants.map((name, idx) => (
                <div key={idx} className="relative">
                  <input
                    ref={el => { inputRefs.current[idx] = el || null; }}
                    type="text"
                    className="block w-full px-4 py-2 rounded-lg border border-teal-200 dark:border-teal-700 bg-teal-50 dark:bg-teal-800 text-teal-900 dark:text-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-400 pr-10"
                    placeholder={`Participante ${idx + 1}`}
                    value={name}
                    onChange={e => {
                      const newList = [...participants];
                      newList[idx] = e.target.value;
                      setParticipants(newList);
                    }}
                  />
                  {participants.length > 1 && (
                    <div className="absolute right-2 top-1.5">
                      <IconButton
                        aria-label="Eliminar participante"
                        size="small"
                        className="bg-white dark:bg-teal-900 shadow"
                        style={{ top: 0 }}
                        onClick={() => {
                          const newList = participants.filter((_, i) => i !== idx);
                          setParticipants(newList);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </div>
                  )}
                </div>
              ))}
            </div>
        </div>
    );
}