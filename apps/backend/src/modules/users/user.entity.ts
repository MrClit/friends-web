import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { USER_ROLES, USER_ROLE, type UserRole } from './user-role.constants';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  avatar: string;

  // enumName is spelled out because the migration named the type `user_role_enum`, while TypeORM would
  // derive `users_role_enum` from the table and column. Declaring it is only correct when it differs
  // from the derived name: when they match, TypeORM's schema loader drops the value, and an explicit
  // one would then read as a permanent change.
  @Column({ type: 'enum', enum: USER_ROLES, enumName: 'user_role_enum', default: USER_ROLE })
  role: UserRole;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
