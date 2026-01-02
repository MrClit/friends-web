import { IsString, IsNotEmpty } from 'class-validator';

export class EventParticipantDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}
