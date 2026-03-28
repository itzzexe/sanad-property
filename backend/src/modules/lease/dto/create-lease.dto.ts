import { IsString, IsNumber, IsOptional, IsEnum, IsDateString, Min, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentFrequency, Currency } from '@prisma/client';

export class CreateLeaseDto {
  @ApiProperty()
  @IsString()
  tenantId: string;

  @ApiProperty()
  @IsString()
  unitId: string;

  @ApiProperty({ example: '2024-01-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2025-01-01' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: 1500 })
  @IsNumber()
  @Min(0)
  rentAmount: number;

  @ApiPropertyOptional({ enum: Currency })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiPropertyOptional({ example: 3000 })
  @IsOptional()
  @IsNumber()
  securityDeposit?: number;

  @ApiPropertyOptional({ enum: PaymentFrequency })
  @IsOptional()
  @IsEnum(PaymentFrequency)
  paymentFrequency?: PaymentFrequency;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  lateFeePercent?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  lateFeeGraceDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  terms?: string;
}
