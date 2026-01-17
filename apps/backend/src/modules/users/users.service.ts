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

  async updateProfileIfEmpty(user: User, name?: string, avatar?: string) {
    let updated = false;
    if (!user.name && name) {
      user.name = name;
      updated = true;
    }
    if (!user.avatar && avatar) {
      user.avatar = avatar;
      updated = true;
    }
    if (updated) {
      await this.userRepository.save(user);
    }
    return user;
  }
}
