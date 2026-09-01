import { ApiProperty } from '@nestjs/swagger';

/**
 * The state of one cell of the planning grid after a write.
 *
 * Returned whether the row was created, updated or deleted — a cell set back to zero answers with zeros
 * rather than an empty 204, so the client reconciles its optimistic update against one shape only.
 */
export class AttendanceCellDto {
  @ApiProperty({ description: 'Participant the cell belongs to' })
  participantId: string;

  @ApiProperty({ description: 'Adults attending', example: 2 })
  adults: number;

  @ApiProperty({ description: 'Children attending', example: 3 })
  children: number;
}
