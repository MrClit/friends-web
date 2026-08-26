import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateShoppingItemDto {
  // Trimmed before validation so a whitespace-only name is a 400 instead of a blank row, and so the
  // stored text is exactly what the share export will print.
  @ApiProperty({
    description: 'Item to buy. Quantity and unit are part of the text, there is no separate field',
    example: '2 cajas de cerveza',
    maxLength: 120,
  })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;
}
