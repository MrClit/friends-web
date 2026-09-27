import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { Group } from '../../groups/entities/group.entity';
import { ApiProperty } from '@nestjs/swagger';
import { EventStatus, type EventParticipant } from '@friends/shared-types';

export { EventStatus, type EventParticipant } from '@friends/shared-types';
export type { UserParticipant, GuestParticipant, PotParticipant } from '@friends/shared-types';

// Backs the event listing: filter by status, order by creation date. Declared here as well as
// in the migration because the DB-backed test suites build their schema from the entities.
@Index('idx_events_status_created_at', ['status', 'createdAt'])
// Backs the foreign key check when a group is deleted, and the "does this group still have events" lookup.
@Index('idx_events_group_id', ['groupId'])
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
  // Deliberately without enumName: TypeORM derives `events_status_enum` from the table and column, which
  // is exactly how the migration named it. Spelling it out would break things rather than harden them —
  // the schema loader drops enumName whenever it matches the derived name, so an explicit one compares
  // unequal on every run. Contrast with User.role, where the names genuinely differ.
  @Column({
    type: 'enum',
    enum: Object.values(EventStatus),
    default: EventStatus.ACTIVE,
  })
  status: EventStatus;

  // The default is the array literal, not a function: TypeORM only compares jsonb defaults as parsed
  // JSON when the declared default is not a function, and a function would compare raw strings that
  // never match what Postgres reports.
  @Column({ type: 'jsonb', default: [] })
  participants: EventParticipant[];

  // Every event belongs to exactly one group, and only its members can be added to it (#121). RESTRICT
  // rather than CASCADE: deleting a group must never take its events and their money with it, so the
  // admin has to move them to another group first.
  @Column({ name: 'group_id', type: 'uuid' })
  groupId: string;

  @ManyToOne(() => Group, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'group_id', foreignKeyConstraintName: 'fk_events_group_id' })
  group?: Group;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Transaction, (transaction) => transaction.event, {
    cascade: true,
  })
  transactions: Transaction[];

  lastModified?: Date;
}
