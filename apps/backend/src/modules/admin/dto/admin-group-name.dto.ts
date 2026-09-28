import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export const GROUP_NAME_MAX_LENGTH = 100;

/**
 * Body of both creating and renaming a group: the name is the only thing an admin can set.
 */
export class AdminGroupNameDto {
  @ApiProperty({
    description: 'Group name. Must be unique, compared case-insensitively.',
    maxLength: GROUP_NAME_MAX_LENGTH,
    example: 'Amigos de la uni',
  })
  // Trim before validating, so a whitespace-only name is rejected instead of stored.
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(GROUP_NAME_MAX_LENGTH)
  name: string;
}
