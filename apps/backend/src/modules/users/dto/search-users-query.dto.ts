import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const SEARCH_QUERY_MIN_LENGTH = 2;
const SEARCH_QUERY_MAX_LENGTH = 100;

/**
 * DTO for the user search query parameters (INPUT)
 * Validates the `q` param before it reaches the ILIKE clause built by UsersService.search
 */
export class SearchUsersQueryDto {
  @ApiProperty({
    description: 'Search term matched against the user name and email. Wildcards are matched literally.',
    minLength: SEARCH_QUERY_MIN_LENGTH,
    maxLength: SEARCH_QUERY_MAX_LENGTH,
    example: 'ana',
  })
  // Trim before the length validators run, so a whitespace-only query is rejected
  // instead of searching for spaces.
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(SEARCH_QUERY_MIN_LENGTH)
  @MaxLength(SEARCH_QUERY_MAX_LENGTH)
  q: string;
}
