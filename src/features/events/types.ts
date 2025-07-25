// Tipos relacionados con eventos
export interface EventParticipant {
  id: string;
  name: string;
}

export interface Event {
  id: string;
  title: string;
  participants: EventParticipant[];
  // Puedes agregar más campos aquí
}
