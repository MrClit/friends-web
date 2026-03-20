import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloudinaryAvatarService } from '../auth/cloudinary-avatar.service';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([User])],
  providers: [UsersService, CloudinaryAvatarService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
