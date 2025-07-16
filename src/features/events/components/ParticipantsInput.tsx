import { useRef, useEffect } from "react";
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import type { EventParticipant } from '../types';
import { useTranslation } from "react-i18next";

interface ParticipantsInputProps {
    participants: EventParticipant[];
    setParticipants: (newParticipants: EventParticipant[] | ((prev: EventParticipant[]) => EventParticipant[])) => void;
}

export default function ParticipantsInput({participants, setParticipants}: ParticipantsInputProps) {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const { t } = useTranslation();

    useEffect(() => {
        if (participants.length > 1) {
            inputRefs.current[participants.length - 1]?.focus();
        }
    }, [participants.length]);

    return (
        <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-teal-700 dark:text-teal-100 font-medium">{t('participantsInput.label')}</label>
              <button
                type="button"
                aria-label={t('participantsInput.addAria')}
                className={`ml-2 p-1 rounded-full hover:bg-teal-200 dark:hover:bg-teal-700 text-teal-600 dark:text-teal-200 transition disabled:opacity-50`}
                onClick={() => setParticipants((p: EventParticipant[]) => [...p, { id: crypto.randomUUID(), name: "" }])}
                disabled={participants.length === 0 || typeof participants[participants.length-1]?.name !== 'string' || participants[participants.length-1]?.name.trim() === ""}
              >
                <PersonAddIcon fontSize="medium" />
              </button>
            </div>
            <div className="space-y-4">
              {participants.map((participant, idx) => (
                <div key={participant.id || idx} className="relative">
                  <input
                    id={participant.id}
                    name={participant.id}       
                    ref={el => { inputRefs.current[idx] = el || null; }}
                    type="text"
                    className="block w-full px-4 py-2 rounded-lg border border-teal-200 dark:border-teal-700 bg-teal-50 dark:bg-teal-800 text-teal-900 dark:text-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-400 pr-10"
                    placeholder={t('participantsInput.placeholder', { number: idx + 1 })}
                    value={participant.name}
                    onChange={e => {
                      const newList = [...participants];
                      newList[idx] = { ...participant, name: e.target.value };
                      setParticipants(newList);
                    }}
                  />
                  {participants.length > 1 && (
                    <div className="absolute right-2 top-1.5">
                      <IconButton
                        aria-label={t('participantsInput.deleteAria')}
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