import { IsString, IsNotEmpty, IsArray, ArrayMinSize, IsOptional } from 'class-validator';
// NOTE: participant DTO types are validated in service-level logic. Keep imports for reference removed to avoid unused errors.

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsArray()
  @ArrayMinSize(1)
  participants: any[];
}
