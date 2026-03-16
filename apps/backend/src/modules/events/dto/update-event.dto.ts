import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { CreateEventDto } from './create-event.dto';
import { ParticipantReplacementDto } from './participant-replacement.dto';

export class UpdateEventDto extends PartialType(CreateEventDto) {
  @ApiPropertyOptional({
    description: 'Guest to user participant replacements to migrate existing transactions',
    type: ParticipantReplacementDto,
    isArray: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParticipantReplacementDto)
  @IsOptional()
  participantReplacements?: ParticipantReplacementDto[];
}
