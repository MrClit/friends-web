import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Event } from '../events/entities/event.entity';
import { Group } from '../groups/entities/group.entity';
import { GroupMember } from '../groups/entities/group-member.entity';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { AdminGroupsController } from './admin-groups.controller';
import { AdminGroupsService } from './admin-groups.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Group, GroupMember, Event])],
  controllers: [AdminUsersController, AdminGroupsController],
  providers: [AdminUsersService, AdminGroupsService],
})
export class AdminModule {}
