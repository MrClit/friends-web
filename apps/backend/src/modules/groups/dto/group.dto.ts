import { ApiProperty } from '@nestjs/swagger';

export class GroupDto {
  @ApiProperty({ description: 'Group UUID' })
  id: string;

  @ApiProperty({ description: 'Group name' })
  name: string;
}

export class GroupMemberDto {
  @ApiProperty({ description: 'User UUID' })
  id: string;

  @ApiProperty({ description: 'User display name', nullable: true })
  name: string | null;

  @ApiProperty({ description: 'User email address' })
  email: string;

  @ApiProperty({ description: 'User avatar URL', nullable: true })
  avatar: string | null;
}
