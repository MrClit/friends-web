import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  Min,
  IsDateString,
} from 'class-validator';

export class CreateTransactionDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsEnum(['contribution', 'expense', 'compensation'])
  paymentType: 'contribution' | 'expense' | 'compensation';

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsNotEmpty()
  participantId: string; // Will be validated against event participants or '0' (POT)

  @IsDateString()
  date: string; // ISO format yyyy-mm-dd
}
