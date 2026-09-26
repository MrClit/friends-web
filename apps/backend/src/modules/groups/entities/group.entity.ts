import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Unique } from 'typeorm';
import { GroupMember } from './group-member.entity';

// A circle of friends, managed by the admin. It is the boundary of who can see whom (see #121).
//
// The unique constraint compares names exactly. The service also rejects names that differ only in case,
// but that rule cannot live here: an index on lower(name) is an expression index, which TypeORM cannot
// declare on the entity, so TYPEORM_SYNC would drop it from the DB-backed suites. The constraint stays as
// the database-level net, and is repeated in the migration under the same name.
@Unique('uq_groups_name', ['name'])
@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @OneToMany(() => GroupMember, (member) => member.group)
  members: GroupMember[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
