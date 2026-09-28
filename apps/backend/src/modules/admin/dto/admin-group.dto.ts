import { ApiProperty } from '@nestjs/swagger';
import { GroupMemberDto } from '../../groups/dto/group.dto';

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

export class AdminGroupMemberDto extends GroupMemberDto {
  @ApiProperty({
    description:
      'Number of groups the user belongs to, this one included. 1 means removing them leaves them groupless.',
  })
  groupCount: number;
}
