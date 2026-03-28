import { IsString, IsOptional, IsEnum, IsNumber, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UnitType, UnitStatus, Currency } from '@prisma/client';

export class CreateUnitDto {
  @ApiProperty({ example: 'A-101' })
  @IsString()
  unitNumber: string;

  @ApiPropertyOptional({ enum: UnitType, default: 'APARTMENT' })
  @IsOptional()
  @IsEnum(UnitType)
  type?: UnitType;

  @ApiPropertyOptional({ enum: UnitStatus, default: 'AVAILABLE' })
  @IsOptional()
  @IsEnum(UnitStatus)
  status?: UnitStatus;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  floor?: number;

  @ApiPropertyOptional({ example: 120.5 })
  @IsOptional()
  @IsNumber()
  area?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  bedrooms?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  bathrooms?: number;

  @ApiProperty({ example: 1500 })
  @IsNumber()
  @Min(0)
  monthlyRent: number;

  @ApiPropertyOptional({ enum: Currency, default: 'USD' })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsString()
  propertyId: string;
}
