import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { ApiProperty } from '@nestjs/swagger';
import { EventStatus, type EventParticipant } from '@friends/shared-types';

export { EventStatus, type EventParticipant } from '@friends/shared-types';
export type { UserParticipant, GuestParticipant, PotParticipant } from '@friends/shared-types';

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

  @ApiProperty({
    enum: Object.values(EventStatus),
    default: EventStatus.ACTIVE,
    description: 'Event status: active or archived',
  })
  @Column({
    type: 'enum',
    enum: Object.values(EventStatus),
    default: EventStatus.ACTIVE,
  })
  status: EventStatus;

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

  lastModified?: Date;
}
