import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { CalendarMeal } from './calendar-meal.entity';

// How many people one participant brings to one sitting.
//
// Rows are sparse: one exists only once somebody has been signed up, and a cell nobody filled in has no
// row at all, which reads as zero. Setting a cell back to zero deletes the row rather than storing zeros,
// so the table stays the size of what was actually answered.
//
// The count is split into adults and children because a row can stand for a whole family, and the split
// changes what the meal has to cater for. It is two columns and not a category dimension so that a cell
// remains a single row, and with it the unique constraint below and the upsert it enables.
//
// participant_id is varchar(50) like the one on transactions: it holds either a user's uuid or a guest's
// free-form id. The pot never appears here — it is not a person and does not eat. No foreign key: guest
// ids exist only inside the event's JSONB participants, so there is no table to point at.
@Unique('uq_event_calendar_attendances_meal_participant', ['mealId', 'participantId'])
@Entity('event_calendar_attendances')
export class CalendarAttendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'meal_id' })
  mealId: string;

  @ManyToOne(() => CalendarMeal, (meal) => meal.attendances, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'meal_id', foreignKeyConstraintName: 'fk_event_calendar_attendances_meal_id' })
  meal: CalendarMeal;

  @Column({ name: 'participant_id', length: 50 })
  participantId: string;

  @Column({ type: 'int', default: 0 })
  adults: number;

  @Column({ type: 'int', default: 0 })
  children: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
