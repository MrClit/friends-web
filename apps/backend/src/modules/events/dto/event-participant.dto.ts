import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

// DTO para participante que es un User existente
export class UserParticipantDto {
  @IsEnum(['user'])
  type: 'user';

  @IsString()
  @IsNotEmpty()
  id: string; // UUID del User
}

// DTO para participante invitado (sin cuenta)
export class GuestParticipantDto {
  @IsEnum(['guest'])
  type: 'guest';

  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}

// Union type para validación
export type EventParticipantDto = UserParticipantDto | GuestParticipantDto;
