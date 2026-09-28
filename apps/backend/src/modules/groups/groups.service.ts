import { ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { isUUID } from 'class-validator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { User } from '../users/user.entity';
import { ADMIN_ROLE } from '../users/user-role.constants';
import { Group } from './entities/group.entity';
import { GroupMember } from './entities/group-member.entity';
import { GroupDto, GroupMemberDto } from './dto/group.dto';

/**
 * Single owner of the group membership rule (#121): who belongs to which group, and therefore who can
 * create events in a group, see its members, and be added to its events. The admin sits above the rule
 * for everything except being a participant: it can use any group, but the people it adds to an event
 * still have to be members of that event's group.
 *
 * Group management itself (create, rename, members) lives in AdminGroupsService.
 */
@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private readonly memberRepository: Repository<GroupMember>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /** The groups of the actor, ordered by name. The admin gets every group. */
  async findGroupsOf(actor: AuthenticatedUser): Promise<GroupDto[]> {
    const query = this.groupRepository
      .createQueryBuilder('group')
      .select(['group.id', 'group.name'])
      .orderBy('group.name', 'ASC');

    if (!this.isAdmin(actor)) {
      query.innerJoin('group.members', 'member', 'member.userId = :userId', { userId: actor.id });
    }

    const groups = await query.getMany();
    return groups.map(({ id, name }) => ({ id, name }));
  }

  /**
   * The members of a group, for a member of that group or the admin. For anyone else a group that does
   * not exist and a group they are not in both read as 403, so its existence does not leak.
   */
  async findMembers(groupId: string, actor: AuthenticatedUser): Promise<GroupMemberDto[]> {
    if (this.isAdmin(actor)) {
      await this.assertGroupExists(groupId);
    } else if (!(await this.isMember(groupId, actor.id))) {
      throw new ForbiddenException(`Access to group ${groupId} is not allowed`);
    }

    // Soft deleted users are filtered out by the query builder itself.
    return this.userRepository
      .createQueryBuilder('user')
      .innerJoin(GroupMember, 'member', 'member.userId = user.id AND member.groupId = :groupId', { groupId })
      .select('user.id', 'id')
      .addSelect('user.name', 'name')
      .addSelect('user.email', 'email')
      .addSelect('user.avatar', 'avatar')
      .orderBy('user.name', 'ASC', 'NULLS LAST')
      .addOrderBy('user.email', 'ASC')
      .getRawMany<GroupMemberDto>();
  }

  /**
   * Whether the actor may create an event in the group, or move one into it: 404 for the admin when the
   * group does not exist, 403 for anyone else who is not a member (a user without groups included).
   */
  async assertCanUse(groupId: string, actor: AuthenticatedUser): Promise<void> {
    if (this.isAdmin(actor)) {
      await this.assertGroupExists(groupId);
      return;
    }

    if (!(await this.isMember(groupId, actor.id))) {
      throw new ForbiddenException(`You are not a member of group ${groupId}`);
    }
  }

  /**
   * Rejects with a 422 unless every user is an active member of the group. The rejected ids travel in
   * `details.userIds`, so the client can name them in its own language.
   *
   * One check covers every way a user id can be wrong: an id that matches no user has no membership, and
   * a soft deleted user loses theirs when deleted (and is filtered out here besides).
   */
  async assertAreMembers(groupId: string, userIds: string[]): Promise<void> {
    const uniqueIds = [...new Set(userIds)];
    if (uniqueIds.length === 0) return;

    // An id that is not even a uuid cannot be a member, and would break the uuid comparison below.
    const candidateIds = uniqueIds.filter((id) => isUUID(id));
    const memberIds = new Set<string>();

    if (candidateIds.length > 0) {
      const rows = await this.userRepository
        .createQueryBuilder('user')
        .innerJoin(GroupMember, 'member', 'member.userId = user.id AND member.groupId = :groupId', { groupId })
        .select('user.id', 'id')
        .where('user.id IN (:...userIds)', { userIds: candidateIds })
        .getRawMany<{ id: string }>();

      for (const row of rows) memberIds.add(row.id);
    }

    const outsiders = uniqueIds.filter((id) => !memberIds.has(id));

    if (outsiders.length > 0) {
      throw new UnprocessableEntityException({
        message: `Users ${outsiders.join(', ')} are not members of group ${groupId}`,
        details: { userIds: outsiders },
      });
    }
  }

  private async assertGroupExists(groupId: string): Promise<void> {
    if (!(await this.groupRepository.exists({ where: { id: groupId } }))) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }
  }

  private isMember(groupId: string, userId: string): Promise<boolean> {
    return this.memberRepository.exists({ where: { groupId, userId } });
  }

  private isAdmin(actor: AuthenticatedUser): boolean {
    return actor.role === ADMIN_ROLE;
  }
}
