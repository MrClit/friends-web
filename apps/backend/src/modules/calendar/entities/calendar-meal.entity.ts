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
import { MealSlot } from '@friends/shared-types';
import { CalendarDay } from './calendar-day.entity';
import { CalendarAttendance } from './calendar-attendance.entity';

// One sitting of one day. Every day is created with the full set of MEAL_SLOTS, so a meal row always
// exists and its description has somewhere to live before anybody signs up.
//
// Same double declaration as the other two tables — the constraint is repeated in the migration because
// the DB-backed suites synchronize the schema from here. day_id leads it, so it also backs the cascade.
@Unique('uq_event_calendar_meals_day_slot', ['dayId', 'slot'])
@Entity('event_calendar_meals')
export class CalendarMeal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'day_id' })
  dayId: string;

  @ManyToOne(() => CalendarDay, (day) => day.meals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'day_id', foreignKeyConstraintName: 'fk_event_calendar_meals_day_id' })
  day: CalendarDay;

  // Text and not a Postgres enum: the slot list is meant to grow (breakfast being the obvious next one)
  // and that should cost a change to MEAL_SLOTS, not a migration.
  @Column({ type: 'varchar', length: 20 })
  slot: MealSlot;

  // The plan for this sitting: 'Paella', 'Reserva en el restaurante X'.
  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @OneToMany(() => CalendarAttendance, (attendance) => attendance.meal)
  attendances: CalendarAttendance[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
