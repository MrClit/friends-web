import { Injectable, ConflictException, Logger, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { ADMIN_ROLE, USER_ROLE, UserRole } from '../users/user-role.constants';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';

interface UserContext {
  id: string;
  role: UserRole;
}

interface PostgresError extends Error {
  code?: string;
}

@Injectable()
export class AdminUsersService {
  private readonly logger = new Logger(AdminUsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      select: ['id', 'email', 'name', 'avatar', 'role', 'createdAt', 'updatedAt'],
      order: { name: 'ASC' },
    });
  }

  async create(createAdminUserDto: CreateAdminUserDto): Promise<User> {
    try {
      const user = this.userRepository.create({
        email: createAdminUserDto.email,
        role: createAdminUserDto.role,
      });

      const savedUser = await this.userRepository.save(user);
      this.logger.log(`Admin created user ${savedUser.id}`);

      return this.pickVisibleFields(savedUser);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(`User with email ${createAdminUserDto.email} already exists`);
      }
      throw error;
    }
  }

  async update(userId: string, updateAdminUserDto: UpdateAdminUserDto, actor: UserContext): Promise<User> {
    const targetUser = await this.findExistingUserOrThrow(userId);

    await this.assertRoleChangeIsAllowed(targetUser, updateAdminUserDto.role, actor);

    try {
      const mergedUser = this.userRepository.merge(targetUser, updateAdminUserDto);
      const savedUser = await this.userRepository.save(mergedUser);

      this.logger.log(`Admin updated user ${savedUser.id}`);
      return this.pickVisibleFields(savedUser);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(`User with email ${updateAdminUserDto.email} already exists`);
      }
      throw error;
    }
  }

  async softDelete(userId: string, actor: UserContext): Promise<{ success: true }> {
    const targetUser = await this.findExistingUserOrThrow(userId);

    if (targetUser.id === actor.id) {
      throw new UnprocessableEntityException('Admin users cannot delete themselves');
    }

    if (targetUser.role === ADMIN_ROLE) {
      await this.assertAtLeastOneAdminRemains();
    }

    await this.userRepository.softDelete(userId);
    this.logger.log(`Admin soft deleted user ${userId}`);

    return { success: true };
  }

  private async findExistingUserOrThrow(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return user;
  }

  private async assertRoleChangeIsAllowed(
    targetUser: User,
    nextRole: UserRole | undefined,
    actor: UserContext,
  ): Promise<void> {
    if (!nextRole || nextRole === targetUser.role) {
      return;
    }

    const isSelfDemotion = targetUser.id === actor.id && targetUser.role === ADMIN_ROLE && nextRole === USER_ROLE;
    if (isSelfDemotion) {
      throw new UnprocessableEntityException('Admin users cannot demote themselves');
    }

    const removesAdminRole = targetUser.role === ADMIN_ROLE && nextRole !== ADMIN_ROLE;
    if (removesAdminRole) {
      await this.assertAtLeastOneAdminRemains();
    }
  }

  private async assertAtLeastOneAdminRemains(): Promise<void> {
    const activeAdmins = await this.userRepository.count({ where: { role: ADMIN_ROLE } });
    if (activeAdmins <= 1) {
      throw new UnprocessableEntityException('At least one active admin user must remain');
    }
  }

  private pickVisibleFields(user: User): User {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      deletedAt: user.deletedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private isUniqueViolation(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const postgresError = error as PostgresError;
    return postgresError.code === '23505';
  }
}
