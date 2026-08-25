import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Event } from '../../events/entities/event.entity';
import { PaymentType } from '@friends/shared-types';
import { columnNumericTransformer } from '../../../common/transformers/column-numeric.transformer';

export type { PaymentType } from '@friends/shared-types';

// Backs both readers of the per-event transaction list: the repository find in
// TransactionsService and the window-function query in TransactionPaginationService. Partial on
// deleted_at because every one of those readers filters soft-deleted rows out.
@Index('idx_transactions_event_date_created_active', ['eventId', 'date', 'createdAt'], {
  where: 'deleted_at IS NULL',
})
@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({
    type: 'enum',
    enum: Object.values(PaymentType),
    enumName: 'payment_type_enum',
    name: 'payment_type',
  })
  paymentType: PaymentType;

  // The transformer is what makes `number` true at runtime: without it the
  // driver hands back a string for decimal columns.
  @Column('decimal', { precision: 10, scale: 2, transformer: columnNumericTransformer })
  amount: number;

  @Column({ length: 50, name: 'participant_id' })
  participantId: string; // '0' for POT or participant ID from event

  // A Postgres `date` column carries no time: TypeORM hydrates it as a
  // 'YYYY-MM-DD' string, so that is what the declared type says.
  @Column('date')
  date: string;

  @Column({ name: 'event_id' })
  eventId: string;

  @ManyToOne(() => Event, 'transactions', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt: Date | null;
}
