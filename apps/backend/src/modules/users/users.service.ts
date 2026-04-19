import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CurrentUserProfileDto } from './dto/current-user-profile.dto';
import { User } from './user.entity';

interface UpdateCurrentUserProfileInput {
  name?: string;
  avatar?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  findByEmail(email: string) {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByIdOrThrow(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user;
  }

  toCurrentUserProfile(user: User): CurrentUserProfileDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async updateProfileIfChanged(user: User, name?: string, avatar?: string) {
    let updated = false;
    if (name && user.name !== name) {
      user.name = name;
      updated = true;
    }
    if (avatar && user.avatar !== avatar) {
      user.avatar = avatar;
      updated = true;
    }
    if (updated) {
      await this.userRepository.save(user);
    }
    return user;
  }

  async getCurrentUserProfileByIdOrThrow(userId: string): Promise<CurrentUserProfileDto> {
    const user = await this.findByIdOrThrow(userId);
    return this.toCurrentUserProfile(user);
  }

  async updateCurrentUserProfile(userId: string, input: UpdateCurrentUserProfileInput): Promise<CurrentUserProfileDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    let updated = false;

    if (typeof input.name === 'string' && user.name !== input.name) {
      user.name = input.name;
      updated = true;
    }

    if (typeof input.avatar === 'string' && user.avatar !== input.avatar) {
      user.avatar = input.avatar;
      updated = true;
    }

    if (updated) {
      await this.userRepository.save(user);
    }

    return this.toCurrentUserProfile(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      select: ['id', 'email', 'name', 'avatar', 'role'],
      order: { name: 'ASC' },
    });
  }

  async search(query: string): Promise<User[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .where('(user.name ILIKE :query OR user.email ILIKE :query)', {
        query: `%${query}%`,
      })
      .andWhere('user.deleted_at IS NULL')
      .select(['user.id', 'user.email', 'user.name', 'user.avatar', 'user.role'])
      .orderBy('user.name', 'ASC')
      .limit(20)
      .getMany();
  }
}
