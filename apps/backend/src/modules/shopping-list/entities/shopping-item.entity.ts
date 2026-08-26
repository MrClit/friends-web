import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Event } from '../../events/entities/event.entity';

// Backs the only read path of the list: every item of one event, in insertion order. Declared here as
// well as in the migration on purpose: the integration and e2e suites build the schema from the
// entities with TYPEORM_SYNC=true, and synchronize drops any index the entities do not declare.
// Since event_id leads, this index also serves the ON DELETE CASCADE from events.
@Index('idx_shopping_items_event_created_at', ['eventId', 'createdAt'])
@Entity('shopping_items')
export class ShoppingItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // The whole item. Quantity and unit live inside this text ('2 cajas de cerveza') instead of being
  // separate columns: the unit is too variable to model and nothing downstream aggregates it.
  @Column({ length: 120 })
  name: string;

  @Column({ name: 'event_id' })
  eventId: string;

  @ManyToOne(() => Event, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  // Attribution columns. Persisted from the start even though the initial UI does not show them,
  // because they cannot be reconstructed later.
  //
  // Plain uuid columns with no relation to User and no foreign key, matching how RefreshToken and
  // AuthExchangeCode hold their user ids: a relation here would be the only foreign key into `users`
  // that the entities declare, which diverges from what the migrations build and breaks TRUNCATE on
  // that table. Users are soft-deleted anyway, so the row a value points at does not disappear.
  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;

  @Column({ name: 'purchased_by', type: 'uuid', nullable: true })
  purchasedBy: string | null;

  // Doubles as the purchased flag: a non-null value means the item has been bought.
  @Column({ name: 'purchased_at', type: 'timestamptz', nullable: true })
  purchasedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
