import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Event } from '../../events/entities/event.entity';

export type PaymentType = 'contribution' | 'expense' | 'compensation';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({
    type: 'enum',
    enum: ['contribution', 'expense', 'compensation'],
    enumName: 'payment_type_enum',
  })
  paymentType: PaymentType;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 50, name: 'participant_id' })
  participantId: string; // '0' for POT or participant ID from event

  @Column('date')
  date: Date;

  @Column({ name: 'event_id' })
  eventId: string;

  @ManyToOne(() => Event, 'transactions', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
