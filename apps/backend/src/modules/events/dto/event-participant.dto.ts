import { IsString, IsNotEmpty, IsEnum, IsIn, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { UserParticipant, GuestParticipant, PotParticipant } from '@friends/shared-types';

export class UserParticipantDto {
  @ApiProperty({ enum: ['user'], example: 'user' })
  @IsEnum(['user'])
  type: UserParticipant['type'];

  @ApiProperty({ description: 'User UUID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiPropertyOptional({ description: 'Enriched display name (read-only, stripped server-side)' })
  @IsString()
  @IsOptional()
  name?: string | null;

  @ApiPropertyOptional({ description: 'Enriched email (read-only, stripped server-side)' })
  @IsString()
  @IsOptional()
  email?: string | null;

  @ApiPropertyOptional({ description: 'Enriched avatar URL (read-only, stripped server-side)' })
  @IsString()
  @IsOptional()
  avatar?: string | null;

  @ApiPropertyOptional({ description: 'Optional contribution target amount', minimum: 0, example: 100 })
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @IsOptional()
  contributionTarget?: number;
}

export class GuestParticipantDto {
  @ApiProperty({ enum: ['guest'], example: 'guest' })
  @IsEnum(['guest'])
  type: GuestParticipant['type'];

  @ApiProperty({ description: 'Guest identifier', example: 'g-abc123' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: 'Guest display name', example: 'Alice' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Optional contribution target amount', minimum: 0, example: 50 })
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @IsOptional()
  contributionTarget?: number;
}

export class PotParticipantDto {
  @ApiProperty({ enum: ['pot'], example: 'pot' })
  @IsEnum(['pot'])
  type: PotParticipant['type'];

  @ApiProperty({ enum: ['0'], example: '0' })
  @IsIn(['0'])
  id: '0';
}

export type EventParticipantDto = UserParticipantDto | GuestParticipantDto | PotParticipantDto;
