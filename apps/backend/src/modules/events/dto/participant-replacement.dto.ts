import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class ParticipantReplacementDto {
  @ApiProperty({
    description: 'Guest participant id to be replaced',
    example: 'guest-123',
  })
  @IsString()
  @IsNotEmpty()
  fromGuestId: string;

  @ApiProperty({
    description: 'Destination user id',
    format: 'uuid',
    example: '4f2ed7ff-9357-4d6f-a424-4ec6a08f6ea9',
  })
  @IsUUID()
  toUserId: string;
}
