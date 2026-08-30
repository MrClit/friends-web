import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCalendarDayDto {
  // Null clears the description, an absent property leaves it alone. @IsOptional() skips validation for
  // both, and the service tells them apart by checking for undefined.
  @ApiPropertyOptional({
    description: 'What the day is about. Null clears it',
    example: 'BAILE DE DISFRACES',
    maxLength: 255,
    nullable: true,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(255)
  description?: string | null;
}
