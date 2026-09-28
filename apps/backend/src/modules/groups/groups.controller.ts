import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport/dist/auth.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiStandardResponse } from '../../common/decorators/api-standard-response.decorator';
import { ApiErrorResponseDto } from '../../common/dto/api-error-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { RolesGuard } from '../auth/roles/roles.guard';
import { GroupsService } from './groups.service';
import { GroupDto, GroupMemberDto } from './dto/group.dto';

@ApiTags('Groups')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Unauthorized', type: ApiErrorResponseDto })
@Controller('groups')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  @ApiOperation({ summary: 'Get the groups of the current user (every group for the admin)' })
  @ApiStandardResponse(200, 'Groups retrieved successfully', GroupDto, true)
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.groupsService.findGroupsOf(user);
  }

  @Get(':id/members')
  @ApiOperation({
    summary: 'Get the members of a group',
    description: 'Only for members of the group and the admin. These are the users that can be added to its events.',
  })
  @ApiStandardResponse(200, 'Group members retrieved successfully', GroupMemberDto, true)
  @ApiResponse({ status: 403, description: 'Not a member of the group', type: ApiErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Group not found (admin only)', type: ApiErrorResponseDto })
  findMembers(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.groupsService.findMembers(id, user);
  }
}
