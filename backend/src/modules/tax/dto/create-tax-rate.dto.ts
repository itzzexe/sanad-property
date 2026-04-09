import { IsString, IsNumber, IsEnum, IsOptional, IsBoolean, IsDateString, Min, Max } from 'class-validator';
import { TaxType } from '@prisma/client';

export class CreateTaxRateDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsNumber()
  @Min(0)
  @Max(0.9999)
  rate: number;

  @IsEnum(TaxType)
  type: TaxType;

  @IsOptional()
  @IsString()
  jurisdiction?: string;

  @IsString()
  accountId: string;

  @IsDateString()
  applicableFrom: string;

  @IsOptional()
  @IsDateString()
  applicableTo?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}
