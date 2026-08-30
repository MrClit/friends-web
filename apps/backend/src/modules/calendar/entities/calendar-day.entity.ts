import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Event } from '../../events/entities/event.entity';
import { CalendarMeal } from './calendar-meal.entity';

// One day of an event's meal calendar. The days are declared by hand, one row each: an event carries no
// start or end date to derive them from, and its days need not be consecutive.
//
// The unique constraint is what makes a date unrepeatable within an event. Declared here as well as in
// the migration on purpose: the integration and e2e suites build the schema from the entities with
// TYPEORM_SYNC=true, and synchronize drops whatever the entities do not declare. Since event_id leads,
// it also serves the ON DELETE CASCADE from events, which is why this table carries no index of its own.
@Unique('uq_event_calendar_days_event_date', ['eventId', 'date'])
@Entity('event_calendar_days')
export class CalendarDay {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'event_id' })
  eventId: string;

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id', foreignKeyConstraintName: 'fk_event_calendar_days_event_id' })
  event: Event;

  // A calendar day, not an instant: stored and returned as 'YYYY-MM-DD', same as Transaction.date.
  @Column('date')
  date: string;

  // What the day is about ('BAILE DE DISFRACES'), as opposed to what is eaten, which belongs to the meal.
  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  // Insert cascade only: a day is created together with its slots, but removing a meal from this array
  // must never delete the row.
  @OneToMany(() => CalendarMeal, (meal) => meal.day, { cascade: ['insert'] })
  meals: CalendarMeal[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
