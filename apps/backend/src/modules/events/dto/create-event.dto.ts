import { IsString, IsNotEmpty, IsArray, ArrayMinSize, IsOptional, IsEnum } from 'class-validator';
// NOTE: participant DTO types are validated in service-level logic. Keep imports for reference removed to avoid unused errors.
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventStatus } from '../entities/event.entity';

export class CreateEventDto {
  @ApiProperty({ description: 'Event title', example: 'Trip to Barcelona' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Event description', example: 'Summer vacation 2026' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Event icon identifier', example: 'beach' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({
    enum: EventStatus,
    default: EventStatus.ACTIVE,
    description: 'Event status',
  })
  @IsEnum(EventStatus)
  @IsOptional()
  status?: EventStatus;

  @ApiProperty({ description: 'Array of event participants', isArray: true })
  @IsArray()
  @ArrayMinSize(1)
  participants: any[];
}
