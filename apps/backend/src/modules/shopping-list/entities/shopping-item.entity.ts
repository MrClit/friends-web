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
import { User } from '../../users/user.entity';

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
  @JoinColumn({ name: 'event_id', foreignKeyConstraintName: 'shopping_items_event_id_fkey' })
  event: Event;

  // Attribution columns. Persisted from the start even though the initial UI does not show them,
  // because they cannot be reconstructed later.
  //
  // Both carry a foreign key with ON DELETE SET NULL. That is the right semantics for attribution: a
  // cascade would delete other people's items along with the user, and a restrict would block ever
  // removing one. Users are soft-deleted, so in practice this never fires; what it buys is the write
  // side, where nothing else stops an id that belongs to no user from being stored.
  //
  // The relations are what make TypeORM emit those keys in the schema the DB-backed suites build with
  // TYPEORM_SYNC=true, and the explicit names are what keep that schema and the migrated one saying the
  // same thing — TypeORM matches foreign keys by name.
  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by', foreignKeyConstraintName: 'fk_shopping_items_created_by' })
  createdByUser?: User | null;

  @Column({ name: 'purchased_by', type: 'uuid', nullable: true })
  purchasedBy: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'purchased_by', foreignKeyConstraintName: 'fk_shopping_items_purchased_by' })
  purchasedByUser?: User | null;

  // Doubles as the purchased flag: a non-null value means the item has been bought.
  @Column({ name: 'purchased_at', type: 'timestamptz', nullable: true })
  purchasedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
