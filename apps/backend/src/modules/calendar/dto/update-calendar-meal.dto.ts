import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCalendarMealDto {
  // Same null-clears-it contract as UpdateCalendarDayDto.
  @ApiPropertyOptional({
    description: 'The plan for this sitting. Null clears it',
    example: 'Paella',
    maxLength: 255,
    nullable: true,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(255)
  description?: string | null;
}
