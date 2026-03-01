import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { CreateAdminUserDto } from './create-admin-user.dto';
import { USER_ROLES, type UserRole } from '../../users/user-role.constants';

export class UpdateAdminUserDto extends PartialType(CreateAdminUserDto) {
  @ApiProperty({ description: 'User email address', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Display name', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiProperty({ description: 'Avatar URL', required: false })
  @IsOptional()
  @IsUrl()
  @MaxLength(1000)
  avatar?: string;

  @ApiProperty({ description: 'User role', enum: USER_ROLES, required: false })
  @IsOptional()
  @IsIn(USER_ROLES)
  role?: UserRole;
}
