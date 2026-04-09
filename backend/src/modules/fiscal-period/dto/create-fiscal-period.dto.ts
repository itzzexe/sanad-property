import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';

export class CreateFiscalPeriodDto {
  @ApiProperty({ example: 'clv...' })
  @IsString()
  @IsNotEmpty()
  fiscalYearId: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  @Max(12)
  periodNumber: number;

  @ApiProperty({ example: 'Jan 2025' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '2025-01-01' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ example: '2025-01-31' })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;
}
