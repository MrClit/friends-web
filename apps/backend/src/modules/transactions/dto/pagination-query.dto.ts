import { Type } from 'class-transformer';
import { IsInt, Min, Max, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for pagination query parameters (INPUT)
 * Used to validate and transform URL query params for paginated endpoints
 */
export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Number of unique dates to return',
    minimum: 1,
    maximum: 50,
    default: 3,
    example: 3,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  numberOfDates: number = 3;

  @ApiPropertyOptional({
    description: 'Offset for pagination (number of dates to skip)',
    minimum: 0,
    default: 0,
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number = 0;
}
