import { IsString, IsNumber, IsNotEmpty, IsEnum, Min, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Currency } from '@prisma/client';

export class UpdateSettingsDto {
  @ApiProperty({ example: 'سند للعقارات' })
  @IsString()
  @IsNotEmpty()
  organizationName: string;

  @ApiProperty({ example: 'بغداد - المنصور' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ enum: Currency, example: Currency.IQD })
  @IsEnum(Currency)
  defaultCurrency: Currency;

  @ApiProperty({ example: 1460.0 })
  @IsNumber()
  @Min(0)
  exchangeRateUSD: number;

  @ApiProperty({ example: 'ar' })
  @IsString()
  @IsNotEmpty()
  language: string;

  @ApiProperty({ example: 'https://example.com/logo.png', required: false })
  @IsString()
  @IsOptional()
  logo?: string;
}
