import { Entity, PrimaryColumn, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../users/user.entity';
import { Group } from './group.entity';

// Membership of one user in one group. An explicit entity rather than a @ManyToMany join table, so the
// foreign key and index names can be pinned to the ones the migration creates.
//
// The primary key leads with group_id, so it already backs the cascade from groups. The index on user_id
// backs the cascade from users and the "groups of a user" lookup.
//
// Users are soft deleted, which never fires the cascade: AdminUsersService removes the memberships of a
// user explicitly when it deletes them.
@Index('idx_group_members_user_id', ['userId'])
@Entity('group_members')
export class GroupMember {
  @PrimaryColumn({ name: 'group_id', type: 'uuid' })
  groupId: string;

  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => Group, (group) => group.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id', foreignKeyConstraintName: 'fk_group_members_group_id' })
  group: Group;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'fk_group_members_user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
