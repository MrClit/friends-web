import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn } from 'class-validator';
import { USER_ROLES, type UserRole } from '../../users/user-role.constants';

export class CreateAdminUserDto {
  @ApiProperty({ description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User role', enum: USER_ROLES })
  @IsIn(USER_ROLES)
  role: UserRole;
}
