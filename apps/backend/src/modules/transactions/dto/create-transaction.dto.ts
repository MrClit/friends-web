import { IsString, IsNotEmpty, IsEnum, IsNumber, Min, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentType } from '@friends/shared-types';

export class CreateTransactionDto {
  @ApiProperty({ description: 'Transaction title', example: 'Hotel room' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Payment type',
    enum: PaymentType,
    example: PaymentType.EXPENSE,
  })
  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @ApiProperty({ description: 'Amount in euros (min 0)', example: 120.5 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: "Participant ID (UUID for users, named guest ID, or '0' for the shared pot)",
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @IsString()
  @IsNotEmpty()
  participantId: string;

  @ApiProperty({ description: 'Transaction date in ISO format', example: '2026-04-26' })
  @IsDateString()
  date: string;
}
