import { ApiProperty } from '@nestjs/swagger';

export class AdminGroupDto {
  @ApiProperty({ description: 'Group UUID' })
  id: string;

  @ApiProperty({ description: 'Group name' })
  name: string;

  @ApiProperty({ description: 'Number of users in the group' })
  memberCount: number;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

export class AdminGroupMemberDto {
  @ApiProperty({ description: 'User UUID' })
  id: string;

  @ApiProperty({ description: 'User display name', nullable: true })
  name: string | null;

  @ApiProperty({ description: 'User email address' })
  email: string;

  @ApiProperty({ description: 'User avatar URL', nullable: true })
  avatar: string | null;

  @ApiProperty({
    description:
      'Number of groups the user belongs to, this one included. 1 means removing them leaves them groupless.',
  })
  groupCount: number;
}
