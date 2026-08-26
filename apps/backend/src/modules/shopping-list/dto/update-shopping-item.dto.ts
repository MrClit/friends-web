import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateShoppingItemDto } from './create-shopping-item.dto';

export class UpdateShoppingItemDto extends PartialType(CreateShoppingItemDto) {
  // Virtual flag: purchasedBy and purchasedAt are derived from it by the service and are never
  // accepted from the client, so attribution cannot be forged.
  @ApiPropertyOptional({
    description: 'Mark the item as purchased or back as pending',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  purchased?: boolean;
}
