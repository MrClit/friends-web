import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCurrentUserProfileDto {
  @ApiProperty({
    description: 'Display name',
    required: false,
    maxLength: 255,
    example: 'Victor Martinez',
  })
  @IsOptional()
  @Transform(({ value }) => {
    const rawValue: unknown = value;
    return typeof rawValue === 'string' ? rawValue.trim() : rawValue;
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;
}