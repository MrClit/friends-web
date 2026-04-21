import { IsString, IsNotEmpty, IsEnum, IsNumber, Min, IsDateString } from 'class-validator';
import { PaymentType } from '@friends/shared-types';

export class CreateTransactionDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsNotEmpty()
  participantId: string; // Will be validated against event participants or '0' (POT)

  @IsDateString()
  date: string; // ISO format yyyy-mm-dd
}
