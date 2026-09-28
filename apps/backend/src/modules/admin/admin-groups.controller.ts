import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport/dist/auth.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiStandardResponse } from '../../common/decorators/api-standard-response.decorator';
import { ApiErrorResponseDto } from '../../common/dto/api-error-response.dto';
import { Roles } from '../auth/roles/roles.decorator';
import { RolesGuard } from '../auth/roles/roles.guard';
import { AdminGroupsService } from './admin-groups.service';
import { AdminGroupDto, AdminGroupMemberDto } from './dto/admin-group.dto';
import { AdminGroupNameDto } from './dto/admin-group-name.dto';

@ApiTags('Admin Groups')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Unauthorized', type: ApiErrorResponseDto })
@ApiResponse({ status: 403, description: 'Forbidden — admin role required', type: ApiErrorResponseDto })
@Controller('admin/groups')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
export class AdminGroupsController {
  constructor(private readonly adminGroupsService: AdminGroupsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all groups with their member count' })
  @ApiStandardResponse(200, 'Groups retrieved successfully', AdminGroupDto, true)
  findAll() {
    return this.adminGroupsService.findAll();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a group' })
  @ApiStandardResponse(201, 'Group created successfully', AdminGroupDto)
  @ApiResponse({ status: 400, description: 'Invalid input', type: ApiErrorResponseDto })
  @ApiResponse({ status: 409, description: 'A group with that name already exists', type: ApiErrorResponseDto })
  create(@Body() dto: AdminGroupNameDto) {
    return this.adminGroupsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Rename a group' })
  @ApiStandardResponse(200, 'Group renamed successfully', AdminGroupDto)
  @ApiResponse({ status: 400, description: 'Invalid input', type: ApiErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Group not found', type: ApiErrorResponseDto })
  @ApiResponse({ status: 409, description: 'A group with that name already exists', type: ApiErrorResponseDto })
  rename(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AdminGroupNameDto) {
    return this.adminGroupsService.rename(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a group and its memberships; the users remain' })
  @ApiStandardResponse(200, 'Group deleted successfully')
  @ApiResponse({ status: 404, description: 'Group not found', type: ApiErrorResponseDto })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminGroupsService.remove(id);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get the members of a group' })
  @ApiStandardResponse(200, 'Group members retrieved successfully', AdminGroupMemberDto, true)
  @ApiResponse({ status: 404, description: 'Group not found', type: ApiErrorResponseDto })
  findMembers(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminGroupsService.findMembers(id);
  }

  @Put(':id/members/:userId')
  @ApiOperation({ summary: 'Add a user to a group (idempotent)' })
  @ApiStandardResponse(200, 'User added to the group')
  @ApiResponse({ status: 404, description: 'Group or user not found', type: ApiErrorResponseDto })
  addMember(@Param('id', ParseUUIDPipe) id: string, @Param('userId', ParseUUIDPipe) userId: string) {
    return this.adminGroupsService.addMember(id, userId);
  }

  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a user from a group (idempotent)' })
  @ApiStandardResponse(200, 'User removed from the group')
  @ApiResponse({ status: 404, description: 'Group not found', type: ApiErrorResponseDto })
  removeMember(@Param('id', ParseUUIDPipe) id: string, @Param('userId', ParseUUIDPipe) userId: string) {
    return this.adminGroupsService.removeMember(id, userId);
  }
}
