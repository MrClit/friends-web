import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  findByEmail(email: string) {
    return this.userRepository.findOne({ where: { email } });
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

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      select: ['id', 'email', 'name', 'avatar', 'role'],
      order: { name: 'ASC' },
    });
  }

  async search(query: string): Promise<User[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .where('user.name ILIKE :query OR user.email ILIKE :query', {
        query: `%${query}%`,
      })
      .select(['user.id', 'user.email', 'user.name', 'user.avatar', 'user.role'])
      .orderBy('user.name', 'ASC')
      .limit(20)
      .getMany();
  }
}
