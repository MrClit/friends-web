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
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport/dist/auth.guard';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiStandardResponse } from '../../common/decorators/api-standard-response.decorator';
import { Roles } from '../auth/roles/roles.decorator';
import { RolesGuard } from '../auth/roles/roles.guard';
import { User } from '../users/user.entity';
import { UserDto } from '../users/dto/user.dto';
import { AdminUsersService } from './admin-users.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import type { Request } from 'express';

@ApiTags('Admin Users')
@Controller('admin/users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active users for admin management' })
  @ApiStandardResponse(200, 'Admin users retrieved successfully', UserDto, true)
  findAll() {
    return this.adminUsersService.findAll();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user as admin' })
  @ApiStandardResponse(201, 'Admin user created successfully', UserDto)
  @ApiResponse({ status: 409, description: 'User with email already exists' })
  create(@Body() createAdminUserDto: CreateAdminUserDto) {
    return this.adminUsersService.create(createAdminUserDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing user as admin' })
  @ApiStandardResponse(200, 'Admin user updated successfully', UserDto)
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'User with email already exists' })
  @ApiResponse({ status: 422, description: 'Safety rule violation' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAdminUserDto: UpdateAdminUserDto,
    @Req() req: Request & { user: User },
  ) {
    return this.adminUsersService.update(id, updateAdminUserDto, {
      id: req.user.id,
      role: req.user.role,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete user as admin' })
  @ApiStandardResponse(200, 'Admin user deleted successfully')
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 422, description: 'Safety rule violation' })
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request & { user: User }) {
    return this.adminUsersService.softDelete(id, {
      id: req.user.id,
      role: req.user.role,
    });
  }
}
