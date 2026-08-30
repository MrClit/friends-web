import { IsInt, IsNotEmpty, IsString, Max, MaxLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** Upper bound per cell. Far above any real party, low enough to catch a slipped keypress. */
export const MAX_ATTENDEES_PER_CELL = 999;

export class SetAttendanceDto {
  @ApiProperty({
    description: "Participant of the event. A user's uuid or a guest's id; the pot is rejected, it does not eat",
    example: '3f7c1b2e-9a4d-4c8f-8f0a-1d2e3f4a5b6c',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  participantId: string;

  @ApiProperty({ description: 'Adults attending this sitting', example: 2, minimum: 0 })
  @IsInt()
  @Min(0)
  @Max(MAX_ATTENDEES_PER_CELL)
  adults: number;

  @ApiProperty({ description: 'Children attending this sitting', example: 3, minimum: 0 })
  @IsInt()
  @Min(0)
  @Max(MAX_ATTENDEES_PER_CELL)
  children: number;
}
