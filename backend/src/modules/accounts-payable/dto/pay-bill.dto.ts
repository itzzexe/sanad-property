import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class PayBillDto {
  @IsNumber()
  amount: number;

  @IsDateString()
  paidAt: string;

  @IsString()
  paymentMethod: string;

  @IsOptional()
  @IsString()
  reference?: string;
}
