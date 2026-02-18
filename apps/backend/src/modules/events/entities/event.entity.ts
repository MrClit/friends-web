import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Transaction } from '../../transactions/entities/transaction.entity';

// Participant que es una referencia a un User existente
export interface UserParticipant {
  type: 'user';
  id: string; // UUID del User
  // Enriquecido al leer: opcionales para respuesta (no necesariamente persistidos)
  name?: string | null;
  email?: string | null;
  avatar?: string | null;
}

// Participant que es un invitado (sin cuenta)
export interface GuestParticipant {
  type: 'guest';
  id: string;
  name: string;
}

// Participant especial para el POT (gasto compartido)
export interface PotParticipant {
  type: 'pot';
  id: '0'; // Siempre será '0'
}

// Union type para participants
export type EventParticipant = UserParticipant | GuestParticipant | PotParticipant;

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ length: 50, nullable: true })
  icon: string;

  @Column('jsonb')
  participants: EventParticipant[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Transaction, (transaction) => transaction.event, {
    cascade: true,
  })
  transactions: Transaction[];
}
