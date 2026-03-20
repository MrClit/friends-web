import { ApiProperty } from '@nestjs/swagger';
import { USER_ROLES, type UserRole } from '../user-role.constants';

export class CurrentUserProfileDto {
  @ApiProperty({ description: 'User UUID' })
  id: string;

  @ApiProperty({ description: 'User email address' })
  email: string;

  @ApiProperty({ description: 'User display name', required: false })
  name?: string;

  @ApiProperty({ description: 'User avatar URL', required: false })
  avatar?: string;

  @ApiProperty({ description: 'User role', enum: USER_ROLES })
  role: UserRole;

  @ApiProperty({ description: 'User creation date', type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ description: 'User last update date', type: String, format: 'date-time' })
  updatedAt: Date;
}