import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import type { UserParticipant, GuestParticipant } from '@friends/shared-types';

export class UserParticipantDto {
  @IsEnum(['user'])
  type: UserParticipant['type'];

  @IsString()
  @IsNotEmpty()
  id: string;
}

export class GuestParticipantDto {
  @IsEnum(['guest'])
  type: GuestParticipant['type'];

  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}

export type EventParticipantDto = UserParticipantDto | GuestParticipantDto;
