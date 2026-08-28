import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/user.entity';

@Entity('auth_exchange_codes')
export class AuthExchangeCode {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_auth_exchange_codes_code_hash', { unique: true })
  @Column({ name: 'code_hash', type: 'varchar' })
  codeHash!: string;

  @Index('idx_auth_exchange_codes_user_id')
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  // Same reasoning as RefreshToken.user: the migration already created this foreign key, and naming it
  // explicitly is what keeps the synchronized schema and the migrated one describing the same thing.
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'auth_exchange_codes_user_id_fkey' })
  user!: User;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'consumed_at', type: 'timestamptz', nullable: true })
  consumedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
