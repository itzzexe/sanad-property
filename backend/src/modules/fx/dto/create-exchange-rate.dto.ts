import { IsString, IsNumber, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { FxSource } from '@prisma/client';

export class CreateExchangeRateDto {
  @IsString()
  fromCurrency: string;

  @IsString()
  toCurrency: string;

  @IsNumber()
  rate: number;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsEnum(FxSource)
  source?: FxSource;
}
