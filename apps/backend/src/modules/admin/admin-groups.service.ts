import { Injectable, ConflictException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from '../groups/entities/group.entity';
import { GroupMember } from '../groups/entities/group-member.entity';
import { User } from '../users/user.entity';
import { AdminGroupDto, AdminGroupMemberDto } from './dto/admin-group.dto';
import { AdminGroupNameDto } from './dto/admin-group-name.dto';
import { isUniqueViolation } from './unique-violation';

@Injectable()
export class AdminGroupsService {
  private readonly logger = new Logger(AdminGroupsService.name);

  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private readonly memberRepository: Repository<GroupMember>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<AdminGroupDto[]> {
    return this.groupRepository
      .createQueryBuilder('group')
      .leftJoin('group.members', 'member')
      .select('group.id', 'id')
      .addSelect('group.name', 'name')
      .addSelect('COUNT(member.userId)::int', 'memberCount')
      .addSelect('group.createdAt', 'createdAt')
      .addSelect('group.updatedAt', 'updatedAt')
      .groupBy('group.id')
      .orderBy('group.name', 'ASC')
      .getRawMany<AdminGroupDto>();
  }

  async create(dto: AdminGroupNameDto): Promise<AdminGroupDto> {
    await this.assertNameIsFree(dto.name);

    const group = await this.saveName(this.groupRepository.create({ name: dto.name }));
    this.logger.log(`Admin created group ${group.id}`);

    return this.toDto(group, 0);
  }

  async rename(groupId: string, dto: AdminGroupNameDto): Promise<AdminGroupDto> {
    const group = await this.findGroupOrThrow(groupId);

    // The group itself is excluded, so changing only the case of its own name is allowed.
    await this.assertNameIsFree(dto.name, groupId);

    group.name = dto.name;
    const saved = await this.saveName(group);
    const memberCount = await this.memberRepository.count({ where: { groupId } });

    this.logger.log(`Admin renamed group ${groupId}`);
    return this.toDto(saved, memberCount);
  }

  /**
   * Deletes the group and, through the foreign key cascade, its memberships. The users themselves stay.
   */
  async remove(groupId: string): Promise<{ success: true }> {
    const result = await this.groupRepository.delete(groupId);
    if (!result.affected) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }

    this.logger.log(`Admin deleted group ${groupId}`);
    return { success: true };
  }

  async findMembers(groupId: string): Promise<AdminGroupMemberDto[]> {
    await this.findGroupOrThrow(groupId);

    // Soft deleted users are filtered out by the query builder itself, and their memberships are
    // removed on delete anyway.
    return this.userRepository
      .createQueryBuilder('user')
      .innerJoin(GroupMember, 'member', 'member.userId = user.id AND member.groupId = :groupId', { groupId })
      .select('user.id', 'id')
      .addSelect('user.name', 'name')
      .addSelect('user.email', 'email')
      .addSelect('user.avatar', 'avatar')
      .addSelect(
        (subQuery) =>
          subQuery.select('COUNT(*)::int').from(GroupMember, 'membership').where('membership.userId = user.id'),
        'groupCount',
      )
      .orderBy('user.name', 'ASC', 'NULLS LAST')
      .addOrderBy('user.email', 'ASC')
      .getRawMany<AdminGroupMemberDto>();
  }

  /**
   * Idempotent: adding someone who is already a member is a no-op, not an error.
   */
  async addMember(groupId: string, userId: string): Promise<{ success: true }> {
    await this.findGroupOrThrow(groupId);

    // exists() skips soft deleted users, so a deleted user reads as missing.
    const userExists = await this.userRepository.exists({ where: { id: userId } });
    if (!userExists) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    await this.memberRepository
      .createQueryBuilder()
      .insert()
      .into(GroupMember)
      .values({ groupId, userId })
      .orIgnore()
      .execute();

    this.logger.log(`Admin added user ${userId} to group ${groupId}`);
    return { success: true };
  }

  /**
   * Idempotent as well. Removing a user from their only group is allowed: they are left without one.
   */
  async removeMember(groupId: string, userId: string): Promise<{ success: true }> {
    await this.findGroupOrThrow(groupId);

    await this.memberRepository.delete({ groupId, userId });

    this.logger.log(`Admin removed user ${userId} from group ${groupId}`);
    return { success: true };
  }

  private async findGroupOrThrow(groupId: string): Promise<Group> {
    const group = await this.groupRepository.findOne({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }
    return group;
  }

  /**
   * The case-insensitive half of the uniqueness rule. The exact half is the uq_groups_name constraint,
   * which saveName() still translates into a 409 for two requests racing past this check.
   */
  private async assertNameIsFree(name: string, exceptGroupId?: string): Promise<void> {
    const query = this.groupRepository.createQueryBuilder('group').where('LOWER(group.name) = LOWER(:name)', { name });
    if (exceptGroupId) {
      query.andWhere('group.id <> :exceptGroupId', { exceptGroupId });
    }

    if (await query.getExists()) {
      throw new ConflictException(`A group named ${name} already exists`);
    }
  }

  private async saveName(group: Group): Promise<Group> {
    try {
      return await this.groupRepository.save(group);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(`A group named ${group.name} already exists`);
      }
      throw error;
    }
  }

  private toDto(group: Group, memberCount: number): AdminGroupDto {
    return {
      id: group.id,
      name: group.name,
      memberCount,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };
  }
}
