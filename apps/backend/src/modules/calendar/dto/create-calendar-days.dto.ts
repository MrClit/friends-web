import { IsArray, ArrayMinSize, ArrayMaxSize, Matches, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * How many days one request may add. The client offers a date range and expands it itself, so a mistyped
 * range is one keystroke away from an enormous request; without this a `1900` to `2100` would try to
 * insert some seventy thousand rows.
 */
export const MAX_DAYS_PER_REQUEST = 60;

export class CreateCalendarDaysDto {
  @ApiProperty({
    description:
      'Calendar days to add, each as YYYY-MM-DD. A range is expanded by the client into individual ' +
      'days. Dates the event already has are ignored, so overlapping ranges are safe to send',
    example: ['2026-09-12', '2026-09-13', '2026-09-21'],
    type: [String],
    maxItems: MAX_DAYS_PER_REQUEST,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_DAYS_PER_REQUEST)
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { each: true, message: 'each date must be a valid date in YYYY-MM-DD format' })
  dates: string[];

  @ApiPropertyOptional({
    description: 'Optional description applied to every day created by this request',
    example: 'BAILE DE DISFRACES',
    maxLength: 255,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(255)
  description?: string;
}
