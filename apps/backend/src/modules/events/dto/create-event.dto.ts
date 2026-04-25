import { IsString, IsNotEmpty, IsArray, ArrayMinSize, IsOptional, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiExtraModels, ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { EventStatus } from '@friends/shared-types';
import {
  EventParticipantDto,
  UserParticipantDto,
  GuestParticipantDto,
  PotParticipantDto,
} from './event-participant.dto';

@ApiExtraModels(UserParticipantDto, GuestParticipantDto, PotParticipantDto)
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

  @ApiProperty({
    description: 'Array of event participants',
    type: 'array',
    items: {
      oneOf: [
        { $ref: getSchemaPath(UserParticipantDto) },
        { $ref: getSchemaPath(GuestParticipantDto) },
        { $ref: getSchemaPath(PotParticipantDto) },
      ],
    },
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => Object, {
    discriminator: {
      property: 'type',
      subTypes: [
        { name: 'user', value: UserParticipantDto },
        { name: 'guest', value: GuestParticipantDto },
        { name: 'pot', value: PotParticipantDto },
      ],
    },
    keepDiscriminatorProperty: true,
  })
  participants: EventParticipantDto[];
}
