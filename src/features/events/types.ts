// Tipos relacionados con eventos
export interface EventParticipant {
  name: string;
}

export interface Event {
  id: string;
  title: string;
  participants: EventParticipant[];
  // Puedes agregar más campos aquí
}
